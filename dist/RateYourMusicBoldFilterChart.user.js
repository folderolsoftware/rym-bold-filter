// ==UserScript==
// @author        Folderol Software
// @name          Rate Your Music Chart bold filter
// @description   Adds a checkbox to RYM chart pages to show only bolded works
// @match         https://rateyourmusic.com/charts/*
// @grant         GM.getValue
// @grant         GM.setValue
// @version       1.0.0
// ==/UserScript==
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";

;// ./node_modules/userscript-utils/dist/src/css/createStylesheet.js
function createStylesheet(styles) {
    const stylesheet = document.createElement('style');
    stylesheet.innerText = styles;
    document.head.appendChild(stylesheet);
    return stylesheet;
}

;// ./src/RateYourMusicBoldFilterChart/RateYourMusicBoldFilterChart.user.ts
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};

const BOLD_CLASS = "is_bolded";
const INSERT_CONTAINER_AFTER_CLASS = "page_charts_settings_summary";
const CHECKBOX_ID = "showOnlyBolds";
const WRAPPER_ID = `${CHECKBOX_ID}_container`;
const SECTION_ID = "page_charts_section_charts";
const RELEASE_CLASS = "page_section_charts_item_wrapper";
const ITEM_CLASS = "page_charts_section_charts_item";
const FILTERED_CLASS = "folderol_filtered";
const RADIO_GROUP_NAME = "folderol_bold_filter";
const FILTER_STATE_KEY = "folderol_filter_state";
const FAKE_CHART_ITEM_CLASS = "folderol_fake_chart_item";
const FORCE_DISPLAY_BLOCK_CLASS = "folderol_force_display_block";
const SHOW_PLACEHOLDER_CHECKBOX_ID = "folderol_show_placeholder";
const PLACEHOLDER_KEY = 'folderol_placeholder_key';
const SHOW_PLACEHOLDER_CLASS = "folderol_placeholders";
var FilterState;
(function (FilterState) {
    FilterState["Off"] = "off";
    FilterState["BoldOnly"] = "boldOnly";
    FilterState["NonBoldOnly"] = "nonBoldOnly";
})(FilterState || (FilterState = {}));
class RateYourMusicBoldFilter {
    constructor() {
        this.filterState = FilterState.Off;
        this.showPlaceholders = false;
    }
    // puts all of the styles on the page that we need for the rest of the script
    addStyles() {
        createStylesheet(`
        #${WRAPPER_ID} {
            background: var(--surface-primary);
            border-radius: 10px;
            color: var(--text-primary);
            padding: 1.5em;
            width: 100%;
            margin-top: 1em;
            margin-bottom: 1em;
        }

        #${WRAPPER_ID} label {
          margin-left: 0.5em;
        }

        .${FILTERED_CLASS} {
          display: none;
        }

        .${FORCE_DISPLAY_BLOCK_CLASS} {
          display: block !important;
        }

        .${SHOW_PLACEHOLDER_CLASS} .${FILTERED_CLASS} {
          display: block;
        }

        .${SHOW_PLACEHOLDER_CLASS} .${FILTERED_CLASS} .object_release > *:not(.number_main),
        .${SHOW_PLACEHOLDER_CLASS} .${FAKE_CHART_ITEM_CLASS} {
          display: none;
        }

        .${SHOW_PLACEHOLDER_CLASS} .${FILTERED_CLASS} .object_release:after {
          content: 'Hidden by Bold Filter';
          font-style: italic;
        }
    `);
    }
    createContainer() {
        const wrapper = document.createElement("div");
        const insertAfter = document.querySelector("." + INSERT_CONTAINER_AFTER_CLASS);
        wrapper.setAttribute("id", WRAPPER_ID);
        const header = document.createElement("b");
        header.textContent = "Bold Filter";
        wrapper.appendChild(header);
        const radioGroup = this.createRadioGroup();
        wrapper.appendChild(radioGroup);
        wrapper.appendChild(this.createShowPlaceholderCheckbox());
        if (insertAfter) {
            const { parentNode, nextSibling } = insertAfter;
            if (nextSibling) {
                parentNode === null || parentNode === void 0 ? void 0 : parentNode.insertBefore(wrapper, nextSibling);
            }
            else {
                parentNode === null || parentNode === void 0 ? void 0 : parentNode.appendChild(wrapper);
            }
        }
    }
    createFakeChartItem() {
        const alreadyExists = !!document.querySelector(`.${FAKE_CHART_ITEM_CLASS}`);
        if (alreadyExists) {
            return;
        }
        const wrapper = document.createElement("div");
        wrapper.classList.add(ITEM_CLASS, FAKE_CHART_ITEM_CLASS, FILTERED_CLASS);
        wrapper.textContent = "Bold Filter: Nothing to see here!";
        const parent = document.getElementById(SECTION_ID);
        parent === null || parent === void 0 ? void 0 : parent.appendChild(wrapper);
    }
    createPaginationObserver() {
        const node = document.getElementById("page_charts_section_charts");
        const observeConfig = {
            childList: true,
            subtree: true,
        };
        const callback = () => {
            this.createFakeChartItem();
            this.refilter(this.readFilterState());
        };
        const observer = new MutationObserver(callback);
        observer.observe(node, observeConfig);
        return observer;
    }
    createRadioGroup() {
        const wrapper = document.createElement("fieldset");
        const off = this.createRadioInput(RADIO_GROUP_NAME, FilterState.Off, "Off");
        const onlyBold = this.createRadioInput(RADIO_GROUP_NAME, FilterState.BoldOnly, "Show Only Bolds");
        const onlyNonBold = this.createRadioInput(RADIO_GROUP_NAME, FilterState.NonBoldOnly, "Show Only Non-Bolds");
        wrapper.appendChild(off);
        wrapper.appendChild(onlyBold);
        wrapper.appendChild(onlyNonBold);
        return wrapper;
    }
    createRadioInput(name, value, displayValue) {
        const wrapper = document.createElement("div");
        const input = document.createElement("input");
        input.setAttribute("type", "radio");
        input.setAttribute("name", name);
        input.setAttribute("id", value);
        input.setAttribute("value", value);
        const checked = value === this.filterState;
        if (checked) {
            input.checked = true;
        }
        input.addEventListener("click", (ev) => {
            const state = ev.target.value;
            this.refilter(state);
            GM.setValue(FILTER_STATE_KEY, state);
        });
        const label = document.createElement("label");
        label.setAttribute("for", value);
        label.textContent = displayValue;
        wrapper.appendChild(input);
        wrapper.appendChild(label);
        return wrapper;
    }
    createShowPlaceholderCheckbox() {
        const wrapper = document.createElement('div');
        const input = document.createElement("input");
        input.setAttribute("id", SHOW_PLACEHOLDER_CHECKBOX_ID);
        input.setAttribute("type", "checkbox");
        input.addEventListener('change', ev => {
            const target = ev.target;
            this.showPlaceholders = target.checked;
            GM.setValue(PLACEHOLDER_KEY, this.showPlaceholders);
            this.refilter(this.readFilterState());
        });
        input.checked = this.showPlaceholders;
        const label = document.createElement('label');
        label.setAttribute('for', SHOW_PLACEHOLDER_CHECKBOX_ID);
        label.textContent = 'Show Placeholders';
        wrapper.appendChild(input);
        wrapper.appendChild(label);
        return wrapper;
    }
    isBold(release) {
        return release.classList.contains(BOLD_CLASS);
    }
    isFakeChartItem(release) {
        return release.classList.contains(FAKE_CHART_ITEM_CLASS);
    }
    getReleases() {
        return [
            ...document.querySelectorAll(`.${RELEASE_CLASS}`),
        ];
    }
    applyClass(element, condition, className) {
        if (condition) {
            element.classList.add(className);
        }
        else {
            element.classList.remove(className);
        }
    }
    filterBolds(releases) {
        releases.forEach((release, i) => {
            const shouldHide = !this.isBold(release);
            this.applyClass(release, shouldHide, FILTERED_CLASS);
        });
    }
    filterUnbolds(releases) {
        releases.forEach((release) => {
            const shouldHide = this.isBold(release);
            this.applyClass(release, shouldHide, FILTERED_CLASS);
        });
    }
    unfilter() {
        this.getReleases().forEach((release) => release.classList.remove(FILTERED_CLASS));
    }
    readFilterState() {
        var _a;
        const checked = document.querySelector(`input[name=${RADIO_GROUP_NAME}]:checked`);
        return (_a = checked === null || checked === void 0 ? void 0 : checked.value) !== null && _a !== void 0 ? _a : FilterState.Off;
    }
    refilter(filterState) {
        this.unfilter();
        const releases = this.getReleases();
        switch (filterState) {
            case FilterState.BoldOnly:
                this.filterBolds(releases);
                break;
            case FilterState.NonBoldOnly:
                this.filterUnbolds(releases);
                break;
            default:
            // do nothing
        }
        const fakeChartItem = document.querySelector(`.${FAKE_CHART_ITEM_CLASS}`);
        const showFakeChartItem = releases.every((release) => release.classList.contains(FILTERED_CLASS) ||
            release.classList.contains(FAKE_CHART_ITEM_CLASS));
        this.applyClass(fakeChartItem, showFakeChartItem, FORCE_DISPLAY_BLOCK_CLASS);
        const releaseSection = document.getElementById(SECTION_ID);
        this.applyClass(releaseSection, this.showPlaceholders && !showFakeChartItem, SHOW_PLACEHOLDER_CLASS);
    }
    main() {
        return __awaiter(this, void 0, void 0, function* () {
            this.addStyles();
            this.filterState = yield GM.getValue(FILTER_STATE_KEY, FilterState.Off);
            this.showPlaceholders = yield GM.getValue(PLACEHOLDER_KEY, false);
            this.createContainer();
            this.createPaginationObserver();
            this.createFakeChartItem();
        });
    }
}
const instance = new RateYourMusicBoldFilter();
window.addEventListener("load", () => __awaiter(void 0, void 0, void 0, function* () { return yield instance.main(); }));

/******/ })()
;