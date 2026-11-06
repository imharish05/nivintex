export function confirmToast(message, confirmLabel = 'Confirm', title = 'Confirm action') {
  return new Promise((resolve) => {
    window.dispatchEvent(new CustomEvent('admin-confirm-toast', {
      detail: { message, confirmLabel, title, resolve },
    }));
  });
}
