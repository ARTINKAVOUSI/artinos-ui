'use client';
import { createContext, useContext } from 'react';

/** What a Field tells the control inside it: the id its label points at, the message that
 *  describes it, and whether it is invalid or required. Controls read it with useField(). */
export interface FieldState {
  controlId?: string;
  describedBy?: string;
  invalid?: boolean;
  required?: boolean;
}

export const FieldContext = createContext<FieldState>({});

export const useField = () => useContext(FieldContext);
