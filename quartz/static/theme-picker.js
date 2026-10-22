// Theme picker: a small dropdown that restyles the site with one of several palettes and font pairs.
// The choice is kept in localStorage, so it follows the reader between pages and visits.
// Each theme overrides Quartz's CSS variables for light mode and, under [saved-theme="dark"], dark mode.
;(function () {
  const themes = {
    parchment: { label: "Parchment" }, // the site's built-in theme (quartz.config.yaml)
    grimoire: {
      label: "Grimoire",
      fonts: ["Cormorant Garamond:wght@500;700", "EB Garamond:ital,wght@0,400;0,700;1,400"],
      header: "Cormorant Garamond", body: "EB Garamond",
      light: ["#f3f0e4", "#dcd6c0", "#a39d84", "#2f3a31", "#18201a", "#2f5d46", "#7a8b3a", "rgba(47,93,70,0.09)"],
      dark: ["#141a16", "#2c362f", "#68786b", "#d3dccf", "#eef3ea", "#8fc4a3", "#c4cf7d", "rgba(143,196,163,0.12)"],
    },
    fell: {
      label: "Ink & Iron",
      fonts: ["IM Fell English:ital@0;1", "Crimson Pro:ital,wght@0,400;0,700;1,400"],
      header: "IM Fell English", body: "Crimson Pro",
      light: ["#f2f2ef", "#d9dadb", "#9a9fa5", "#2d3237", "#16191c", "#3e5c76", "#7d5a3c", "rgba(62,92,118,0.09)"],
      dark: ["#15181b", "#2e3339", "#6c747c", "#d5d9dd", "#f0f2f4", "#8fb2d1", "#d2a679", "rgba(143,178,209,0.12)"],
    },
    tavern: {
      label: "Tavern",
      fonts: ["MedievalSharp", "Lora:ital,wght@0,400;0,700;1,400"],
      header: "MedievalSharp", body: "Lora",
      light: ["#f5ead7", "#e0cba8", "#b0926a", "#3d2a1a", "#24170c", "#8b4513", "#a8741a", "rgba(139,69,19,0.09)"],
      dark: ["#1d150e", "#3d2e20", "#806650", "#e3d2bb", "#f6ecdd", "#e39a5d", "#e0b65a", "rgba(227,154,93,0.12)"],
    },
    moonlit: {
      label: "Moonlit",
      fonts: ["Marcellus", "Spectral:ital,wght@0,400;0,700;1,400"],
      header: "Marcellus", body: "Spectral",
      light: ["#f1f3f8", "#d6dbe8", "#9aa3bb", "#2b3145", "#151a29", "#4a5fa8", "#7a5aa6", "rgba(74,95,168,0.09)"],
      dark: ["#11141f", "#272d42", "#646d8c", "#d2d7e6", "#eef1f9", "#9fb0ec", "#c2a6e8", "rgba(159,176,236,0.12)"],
    },
    blood: {
      label: "Blood & Bone",
      fonts: ["Pirata One", "Libre Baskerville:ital,wght@0,400;0,700;1,400"],
      header: "Pirata One", body: "Libre Baskerville",
      light: ["#efebe4", "#d6cfc4", "#a2978a", "#2a2421", "#120e0c", "#9b1c1c", "#6b4f3a", "rgba(155,28,28,0.08)"],
      dark: ["#120f0e", "#2d2725", "#6f6560", "#dcd3cc", "#f5efe9", "#e05d5d", "#c49a7c", "rgba(224,93,93,0.12)"],
    },
    modern: {
      label: "Clean",
      fonts: ["Inter:wght@400;700"],
      header: "Inter", body: "Inter",
      light: ["#faf8f8", "#e5e5e5", "#b8b8b8", "#4e4e4e", "#2b2b2b", "#284b63", "#84a59d", "rgba(143,159,169,0.15)"],
      dark: ["#161618", "#393639", "#646464", "#d4d4d4", "#ebebec", "#7b97aa", "#84a59d", "rgba(143,159,169,0.15)"],
    },
  }
  const vars = ["light", "lightgray", "gray", "darkgray", "dark", "secondary", "tertiary", "highlight"]
  const key = "hollowmere-theme"
  const defaultTheme = "grimoire"
  const read = () => { try { return localStorage.getItem(key) } catch { return null } }
  const write = (v) => { try { localStorage.setItem(key, v) } catch {} }

  // One stylesheet holding every theme's variables, keyed on html[data-skin].
  const css = Object.entries(themes).filter(([, t]) => t.light).map(([id, t]) => {
    const block = (vals) => vals.map((v, i) => `--${vars[i]}:${v}`).join(";")
    const fonts = `--headerFont:"${t.header}",serif;--titleFont:"${t.header}",serif;--bodyFont:"${t.body}",serif`
    return `html[data-skin="${id}"]{${block(t.light)};${fonts}}` +
      `html[data-skin="${id}"][saved-theme="dark"]{${block(t.dark)}}`
  }).join("\n") +
    // The fonts plugin hard-codes the header font on headings, so point them back at the variable.
    "\nhtml[data-skin] :is(h1,h2,h3,h4,h5,h6,.page-title){font-family:var(--headerFont)}"
  // Quartz drops unknown <head> elements when it swaps pages, so the stylesheet is re-added on every navigation.
  function ensureStyle() {
    if (document.getElementById("skin-css")) return
    const style = document.createElement("style")
    style.id = "skin-css"
    style.textContent = css
    document.head.appendChild(style)
  }

  function loadFonts(id) {
    const t = themes[id]
    if (!t || !t.fonts || document.getElementById("skin-font-" + id)) return
    const link = document.createElement("link")
    link.id = "skin-font-" + id
    link.rel = "stylesheet"
    link.href = "https://fonts.googleapis.com/css2?" +
      t.fonts.map((f) => "family=" + f.replace(/ /g, "+")).join("&") + "&display=swap"
    document.head.appendChild(link)
  }
  function apply(id) {
    if (!themes[id]) id = defaultTheme
    ensureStyle()
    loadFonts(id)
    if (id === "parchment") document.documentElement.removeAttribute("data-skin")
    else document.documentElement.setAttribute("data-skin", id)
    return id
  }
  // First visit: dark mode. Quartz's own toggle stores the choice under "theme", so a later change sticks.
  try {
    if (!localStorage.getItem("theme")) {
      localStorage.setItem("theme", "dark")
      document.documentElement.setAttribute("saved-theme", "dark")
    }
  } catch {}
  apply(read())

  // Quartz swaps page content on navigation, so re-add the picker after each "nav" event.
  function mount() {
    apply(read())
    const existing = document.getElementById("theme-picker")
    if (existing) { existing.querySelector("select").value = read() || defaultTheme; return }
    const wrap = document.createElement("label")
    wrap.id = "theme-picker"
    wrap.textContent = "Theme "
    const select = document.createElement("select")
    for (const [id, t] of Object.entries(themes)) select.add(new Option(t.label, id))
    select.value = read() || defaultTheme
    select.addEventListener("change", () => write(apply(select.value)))
    wrap.appendChild(select)
    // End of the page content, below the footer, so it only shows once the reader has scrolled all the way down.
    const footer = document.querySelector("footer")
    ;(footer ? footer.parentElement : document.body).appendChild(wrap)
  }
  document.addEventListener("nav", mount)
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount)
  else mount()
})()
