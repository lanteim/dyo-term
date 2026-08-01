"use strict";
// Widget dashboard built on Gridstack (MIT). Edit mode lets you drag, resize,
// add and remove widgets iOS-style; the layout persists to settings.

class Dashboard {
    constructor(host, settings) {
        this.settings = settings;
        this.mounted = new Map(); // itemEl -> {widgetId, instance}
        host.innerHTML = `
            <div id="editbar">
                <span class="hint" data-i18n="edit.add">Add widget:</span>
                <div id="widget-chips" style="display:flex;gap:8px;flex-wrap:wrap"></div>
                <span class="hint" data-i18n="edit.hint">Drag by header · resize from edges · ✕ to remove</span>
            </div>
            <div class="grid-stack"></div>`;
        this.gridEl = host.querySelector(".grid-stack");

        this.grid = window.GridStack.init({
            column: 12,
            cellHeight: 70,
            margin: 6,
            float: false,
            handle: ".widget > header",
            staticGrid: true,
            animate: true
        }, this.gridEl);

        this.grid.on("change", () => this.persist());
        this._buildChips(host);

        const saved = settings.layout;
        if (saved && Array.isArray(saved.items) && saved.items.length) {
            saved.items.forEach(it => this.addWidget(it.widgetId, it, false));
        } else {
            this._defaultLayout();
        }
    }

    _defaultLayout() {
        this.addWidget("clock", { x: 0, y: 0, w: 12, h: 2 }, false);
        this.addWidget("sysmon", { x: 0, y: 2, w: 12, h: 4 }, false);
        this.addWidget("netmon", { x: 0, y: 6, w: 12, h: 4 }, false);
        this.addWidget("nowplaying", { x: 0, y: 10, w: 12, h: 4 }, false);
        this.addWidget("notes", { x: 0, y: 14, w: 12, h: 4 }, false);
        this.persist();
    }

    _buildChips(host) {
        const chips = host.querySelector("#widget-chips");
        Object.values(window.WIDGETS).forEach(w => {
            const chip = document.createElement("div");
            chip.className = "chip";
            chip.setAttribute("data-i18n-prefix", w.title);
            chip.textContent = "+ " + window.I18N.t(w.title);
            chip.onclick = () => { this.addWidget(w.id, { autoPosition: true }, true); };
            chips.appendChild(chip);
        });
    }

    addWidget(widgetId, pos, persist) {
        const def = window.WIDGETS[widgetId];
        if (!def) return;
        const size = def.defaultSize || { w: 6, h: 3 };
        const opts = {
            w: pos.w || size.w, h: pos.h || size.h,
            x: pos.x, y: pos.y,
            autoPosition: pos.autoPosition || (pos.x == null),
            id: widgetId + ":" + Math.random().toString(36).slice(2, 7)
        };

        const content = document.createElement("div");
        content.className = "widget";
        content.innerHTML = `<header><span class="title" data-i18n="${def.title}">${window.I18N.t(def.title)}</span><span class="sub"></span><span class="remove">${window.ICONS.close}</span></header><div class="body"></div>`;

        const item = this.grid.addWidget(Object.assign({}, opts, { content: "" }));
        const contentHost = item.querySelector(".grid-stack-item-content");
        contentHost.appendChild(content);
        item.gridstackNode.dyoWidget = widgetId;

        content.querySelector(".remove").onclick = (e) => {
            e.stopPropagation();
            this.removeItem(item);
        };

        const instance = def.mount(content.querySelector(".body"));
        this.mounted.set(item, { widgetId, instance });
        if (persist) this.persist();
    }

    removeItem(item) {
        const rec = this.mounted.get(item);
        if (rec && rec.instance && rec.instance.destroy) rec.instance.destroy();
        this.mounted.delete(item);
        this.grid.removeWidget(item);
        this.persist();
    }

    setEditing(on) {
        document.body.classList.toggle("editing", on);
        this.grid.setStatic(!on);
    }

    persist() {
        const items = [];
        this.grid.engine.nodes.forEach(n => {
            items.push({ widgetId: n.dyoWidget, x: n.x, y: n.y, w: n.w, h: n.h });
        });
        this.settings.layout = { items };
        window.dyo.settings.set({ layout: this.settings.layout });
    }
}

window.Dashboard = Dashboard;
