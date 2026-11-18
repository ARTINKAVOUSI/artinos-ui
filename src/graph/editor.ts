'use client';
import { useCallback, useMemo, useRef, useState } from 'react';
import { createHistory } from '../core/history';
import { connectionError, createNode, edgesInto, topologicalOrder, type GraphDefinition, type GraphEdge, type GraphNode } from './graph';

const HISTORY_LIMIT = 60;
const PASTE_OFFSET = 28;
export const GRID = 10;
export const snap = (value: number, enabled = true) => (enabled ? Math.round(value / GRID) * GRID : Math.round(value));

const clone = (graph: GraphDefinition): GraphDefinition => structuredClone(graph);
// One clipboard for every editor on the page, like any other editor.
let clipboard: { nodes: GraphNode[]; edges: GraphEdge[] } | null = null;

export interface GraphEditor {
  graph: GraphDefinition;
  apply(next: GraphDefinition, options?: { history?: boolean; merge?: string }): void;
  /** A drag is one undo entry: snapshot on the first move, push once on release. */
  beginGesture(): void;
  endGesture(): void;
  undo(): void;
  redo(): void;
  canUndo: boolean;
  canRedo: boolean;
  addNode(type: string, x: number, y: number): GraphNode;
  connect(from: string, output: string, to: string, input: string): string | undefined;
  disconnect(edgeId: string): void;
  removeNodes(ids: readonly string[]): void;
  duplicate(ids: readonly string[]): string[];
  copy(ids: readonly string[]): void;
  paste(x: number, y: number): string[];
  canPaste: boolean;
  moveNodes(deltas: ReadonlyMap<string, { x: number; y: number }>, snapToGrid: boolean): void;
  setField(nodeId: string, fieldId: string, value: unknown): void;
  rename(nodeId: string, label: string): void;
  group(ids: readonly string[]): string | undefined;
  ungroup(groupId: string): void;
  renameGroup(groupId: string, label: string): void;
  toggleGroup(groupId: string): void;
  autoLayout(): void;
}

/**
 * The editing model: every mutation, with undo/redo, a clipboard and groups.
 *
 * The caller owns the definition — `onChange` receives a new one for every
 * edit. Mutations read a ref rather than the rendered graph, so adding a node
 * and wiring it in the same tick both build on the same up-to-date definition.
 */
export function useGraphEditor(graph: GraphDefinition, onChange: (next: GraphDefinition) => void): GraphEditor {
  const ref = useRef(graph);
  ref.current = graph;
  const history = useRef(createHistory<GraphDefinition>({ limit: HISTORY_LIMIT })).current;
  const gesture = useRef<GraphDefinition | null>(null);
  const [, bump] = useState(0);

  const apply = useCallback(
    (next: GraphDefinition, options: { history?: boolean; merge?: string } = {}) => {
      if (options.history !== false && !gesture.current) history.record(clone(ref.current), next, { merge: options.merge });
      ref.current = next;
      onChange(next);
    },
    [onChange],
  );

  return useMemo<GraphEditor>(
    () => ({
      graph,
      apply,
      beginGesture() {
        if (!gesture.current) gesture.current = clone(ref.current);
      },
      endGesture() {
        const baseline = gesture.current;
        gesture.current = null;
        if (!baseline || JSON.stringify(baseline) === JSON.stringify(ref.current)) return;
        history.record(baseline, clone(ref.current));
        bump((value) => value + 1);
      },
      undo() {
        const step = history.undo();
        if (step) apply(step.before, { history: false });
      },
      redo() {
        const step = history.redo();
        if (step) apply(step.after, { history: false });
      },
      canUndo: history.undoable > 0,
      canRedo: history.redoable > 0,

      addNode(type, x, y) {
        const node = createNode(type, snap(x), snap(y));
        apply({ ...ref.current, nodes: [...ref.current.nodes, node] });
        return node;
      },
      connect(from, output, to, input) {
        const current = ref.current;
        const fromNode = current.nodes.find((node) => node.id === from);
        const toNode = current.nodes.find((node) => node.id === to);
        if (!fromNode || !toNode) return 'Node not found';
        const problem = connectionError(current, fromNode, output, toNode, input);
        if (problem) return problem;
        const order = edgesInto(current, to, input).length;
        apply({ ...current, edges: [...current.edges, { id: `edge-${Date.now().toString(36)}-${current.edges.length}`, from, output, to, input, order }] });
        return undefined;
      },
      disconnect(edgeId) {
        apply({ ...ref.current, edges: ref.current.edges.filter((edge) => edge.id !== edgeId) });
      },
      removeNodes(ids) {
        const gone = new Set(ids);
        if (!gone.size) return;
        const current = ref.current;
        apply({
          ...current,
          nodes: current.nodes.filter((node) => !gone.has(node.id)),
          edges: current.edges.filter((edge) => !gone.has(edge.from) && !gone.has(edge.to)),
          groups: (current.groups ?? [])
            .map((group) => ({ ...group, nodes: group.nodes.filter((id) => !gone.has(id)) }))
            .filter((group) => group.nodes.length > 1),
        });
      },
      duplicate(ids) {
        const set = new Set(ids);
        const current = ref.current;
        const originals = current.nodes.filter((node) => set.has(node.id));
        if (!originals.length) return [];
        const remap = new Map(
          originals.map((node) => [node.id, { ...createNode(node.type, node.x + PASTE_OFFSET, node.y + PASTE_OFFSET, { ...node.data }), label: node.label }]),
        );
        const copies = [...remap.values()];
        const edges = current.edges
          .filter((edge) => set.has(edge.from) && set.has(edge.to))
          .map((edge, index) => ({ ...edge, id: `edge-${Date.now().toString(36)}-copy${index}`, from: remap.get(edge.from)!.id, to: remap.get(edge.to)!.id }));
        apply({ ...current, nodes: [...current.nodes, ...copies], edges: [...current.edges, ...edges] });
        return copies.map((node) => node.id);
      },
      copy(ids) {
        const set = new Set(ids);
        const current = ref.current;
        const nodes = current.nodes.filter((node) => set.has(node.id));
        clipboard = nodes.length
          ? { nodes: structuredClone(nodes), edges: structuredClone(current.edges.filter((edge) => set.has(edge.from) && set.has(edge.to))) }
          : null;
        bump((value) => value + 1);
      },
      paste(x, y) {
        if (!clipboard?.nodes.length) return [];
        const current = ref.current;
        const left = Math.min(...clipboard.nodes.map((node) => node.x));
        const top = Math.min(...clipboard.nodes.map((node) => node.y));
        const remap = new Map(
          clipboard.nodes.map((node) => [node.id, createNode(node.type, snap(x + node.x - left), snap(y + node.y - top), { ...node.data })]),
        );
        const copies = clipboard.nodes.map((node) => ({ ...remap.get(node.id)!, label: node.label }));
        const edges = clipboard.edges.map((edge, index) => ({
          ...edge,
          id: `edge-${Date.now().toString(36)}-paste${index}`,
          from: remap.get(edge.from)!.id,
          to: remap.get(edge.to)!.id,
        }));
        apply({ ...current, nodes: [...current.nodes, ...copies], edges: [...current.edges, ...edges] });
        return copies.map((node) => node.id);
      },
      canPaste: Boolean(clipboard?.nodes.length),
      moveNodes(deltas, snapToGrid) {
        if (!deltas.size) return;
        apply(
          {
            ...ref.current,
            nodes: ref.current.nodes.map((node) => {
              const delta = deltas.get(node.id);
              return delta ? { ...node, x: snap(node.x + delta.x, snapToGrid), y: snap(node.y + delta.y, snapToGrid) } : node;
            }),
          },
          { history: false },
        );
      },
      setField(nodeId, fieldId, value) {
        // one drag on a field is one undo step
        apply(
          {
            ...ref.current,
            nodes: ref.current.nodes.map((node) => (node.id === nodeId ? { ...node, data: { ...(node.data ?? {}), [fieldId]: value } } : node)),
          },
          { merge: `${nodeId}.${fieldId}` },
        );
      },
      rename(nodeId, label) {
        apply({ ...ref.current, nodes: ref.current.nodes.map((node) => (node.id === nodeId ? { ...node, label: label || undefined } : node)) });
      },
      group(ids) {
        const current = ref.current;
        const members = [...new Set(ids)].filter((id) => current.nodes.some((node) => node.id === id));
        if (members.length < 2) return undefined;
        const id = `group-${Date.now().toString(36)}`;
        // A node belongs to one group, so grouping moves it out of any previous one.
        const groups = (current.groups ?? [])
          .map((item) => ({ ...item, nodes: item.nodes.filter((nodeId) => !members.includes(nodeId)) }))
          .filter((item) => item.nodes.length > 1);
        apply({ ...current, groups: [...groups, { id, label: `Group ${groups.length + 1}`, nodes: members }] });
        return id;
      },
      ungroup(groupId) {
        apply({ ...ref.current, groups: (ref.current.groups ?? []).filter((group) => group.id !== groupId) });
      },
      renameGroup(groupId, label) {
        apply({ ...ref.current, groups: (ref.current.groups ?? []).map((group) => (group.id === groupId ? { ...group, label } : group)) });
      },
      toggleGroup(groupId) {
        apply({
          ...ref.current,
          groups: (ref.current.groups ?? []).map((group) => (group.id === groupId ? { ...group, collapsed: !group.collapsed } : group)),
        });
      },
      autoLayout() {
        const current = ref.current;
        const { order } = topologicalOrder(current);
        const depth = new Map<string, number>();
        for (const node of order) {
          const incoming = current.edges.filter((edge) => edge.to === node.id);
          depth.set(node.id, incoming.length ? Math.max(...incoming.map((edge) => (depth.get(edge.from) ?? 0) + 1)) : 0);
        }
        const rows = new Map<number, number>();
        const COLUMN = 250;
        const ROW = 150;
        apply({
          ...current,
          nodes: current.nodes.map((node) => {
            const column = depth.get(node.id) ?? 0;
            const row = rows.get(column) ?? 0;
            rows.set(column, row + 1);
            return { ...node, x: 30 + column * COLUMN, y: 30 + row * ROW };
          }),
        });
      },
    }),
    [apply, graph],
  );
}
