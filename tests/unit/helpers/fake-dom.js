// Minimal DOM + browser globals so the minigame framework (src/jobs/framework.js) imports
// and runs in Node. The real framework owns the job window: it reads elements with the `$`
// helper ($ = document.getElementById), draws on a canvas, and schedules an animation loop.
// Unit tests don't draw or wait on real timers, so every element here is a quiet stub and
// requestAnimationFrame is a no-op. That lets a test open a shift through the real framework
// and then step the game by hand, one frame at a time.
//
// Importing this module installs the globals as a side effect. Import it before framework.js.

function stubCanvasContext() {
  // A canvas 2D context where every method does nothing and every getter returns a stub.
  // Games draw inside step/draw; tests never inspect pixels, so drawing must simply not throw.
  return new Proxy(
    {
      canvas: { width: 1672, height: 941 },
      save() {},
      restore() {},
      measureText() {
        return { width: 0 }
      },
      createLinearGradient() {
        return { addColorStop() {} }
      }
    },
    {
      get(target, key) {
        if (key in target) return target[key]
        return () => {}
      },
      set(target, key, value) {
        target[key] = value
        return true
      }
    }
  )
}

function stubElement() {
  const classes = new Set()
  const element = {
    textContent: "",
    innerHTML: "",
    hidden: false,
    className: "",
    style: {},
    classList: {
      add: (name) => classes.add(name),
      remove: (name) => classes.delete(name),
      toggle: (name, force) => {
        const on = force === undefined ? !classes.has(name) : force
        if (on) classes.add(name)
        else classes.delete(name)
        return on
      },
      contains: (name) => classes.has(name)
    },
    getContext: () => stubCanvasContext(),
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1672, height: 941 }),
    addEventListener() {},
    removeEventListener() {},
    setPointerCapture() {},
    closest: () => null
  }
  return element
}

// One stub element per id, reused so a test can read what the framework wrote to it.
const elements = {}
function elementById(id) {
  if (!elements[id]) elements[id] = stubElement()
  return elements[id]
}

export function installFakeDom() {
  if (globalThis.__fakeDomInstalled) return
  globalThis.__fakeDomInstalled = true
  globalThis.document = {
    getElementById: elementById,
    addEventListener() {},
    removeEventListener() {}
  }
  globalThis.performance = globalThis.performance || { now: () => 0 }
  // No-op animation loop: the framework schedules draws, but tests step by hand instead.
  globalThis.requestAnimationFrame = () => 0
  globalThis.cancelAnimationFrame = () => {}
  // jobImage() makes an Image; it is never drawn here (imgReady stays false), so a bare stub is enough.
  globalThis.Image = class {
    constructor() {
      this.src = ""
      this.complete = false
      this.naturalWidth = 0
    }
  }
}

installFakeDom()

export { elementById }
