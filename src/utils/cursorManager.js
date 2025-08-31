/**
 * Custom Cursor Manager
 * Handles dynamic cursor changes and APNG support detection
 */

class CursorManager {
  constructor() {
    this.cursors = {
      normal: 'url("../assets/mouse cursor/normal.png"), auto',
      link: 'url("../assets/mouse cursor/link.png"), pointer',
      text: 'url("../assets/mouse cursor/text.png"), text',
      help: 'url("../assets/mouse cursor/help.png"), help',
      busy: 'url("../assets/mouse cursor/busy.png"), wait',
      move: 'url("../assets/mouse cursor/move.png"), move',
      unavailable: 'url("../assets/mouse cursor/unavailable.png"), not-allowed',
      precision: 'url("../assets/mouse cursor/precision.png"), crosshair'
    };
  }

  // Set cursor for specific element
  setCursor(element, cursorType) {
    if (element && this.cursors[cursorType]) {
      element.style.cursor = this.cursors[cursorType];
    }
  }

  // Set global cursor
  setGlobalCursor(cursorType) {
    if (this.cursors[cursorType]) {
      document.body.style.cursor = this.cursors[cursorType];
    }
  }

  // Reset to normal cursor
  resetCursor(element = document.body) {
    element.style.cursor = this.cursors.normal;
  }

  // Add cursor class to element
  addCursorClass(element, cursorType) {
    if (element) {
      element.classList.add(`cursor-${cursorType}`);
    }
  }

  // Remove cursor class from element
  removeCursorClass(element, cursorType) {
    if (element) {
      element.classList.remove(`cursor-${cursorType}`);
    }
  }
}

// Export singleton instance
export const cursorManager = new CursorManager();