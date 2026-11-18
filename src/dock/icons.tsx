/* Stroke icons for the dock chrome: 16px grid, currentColor. */

const icon = (d: string) => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);

export const DockIcons = {
  sliders: icon('M3 4h6M12 4h1M3 8h2M8 8h5M3 12h7M13 12h0M10.5 2.5v3M6.5 6.5v3M11.5 10.5v3'),
  close: icon('M4 4l8 8M12 4l-8 8'),
  search: icon('M7 11.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zM10.5 10.5L14 14'),
  maximize: icon('M9.5 2.5h4v4M6.5 13.5h-4v-4M13.5 2.5L9 7M2.5 13.5L7 9'),
  minimize: icon('M13.5 6.5h-4v-4M2.5 9.5h4v4M9.5 6.5L14 2M6.5 9.5L2 14'),
  float: icon('M2.5 6h8v7.5h-8zM5.5 6V2.5h8V10h-3'),
  popout: icon('M9.5 2.5h4v4M13.5 2.5L8 8M11.5 9.5v4h-9v-9h4'),
  returnHome: icon('M6 3.5L2.5 7 6 10.5M2.5 7H10a3.5 3.5 0 0 1 0 7H8'),
};
