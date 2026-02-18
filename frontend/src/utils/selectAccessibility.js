export const blurActiveElement = () => {
  if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
};

export const selectA11yProps = {
  onClose: blurActiveElement,
  MenuProps: {
    disableAutoFocusItem: true,
  },
};
