// ==UserScript==
// @name          Rate Your Music Chart bold filter
// @description   Adds a checkbox to RYM chart pages to show only bolded works
// @match         https://rateyourmusic.com/charts/*
// @grant         GM.getValue
// @grant         GM.setValue
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
const INSERT_CONTAINER_BEFORE_CLASS = "page_chart_query_become_subscriber";
const CHECKBOX_ID = "showOnlyBolds";
const WRAPPER_ID = `${CHECKBOX_ID}_container`;
const SECTION_ID = "page_charts_section_charts";
const RELEASE_CLASS = "page_section_charts_item_wrapper";
const ITEM_CLASS = "page_charts_section_charts_item";
const FILTERED_CLASS = 'folderol_filtered';
const RADIO_GROUP_NAME = 'folderol_bold_filter';
const FILTER_STATE_KEY = 'folderol_filter_state';
const FAKE_CHART_ITEM_CLASS = 'folderol_fake_chart_item';
const FORCE_DISPLAY_BLOCK_CLASS = 'folderol_force_display_block';
var FilterState;
(function (FilterState) {
    FilterState["Off"] = "off";
    FilterState["BoldOnly"] = "boldOnly";
    FilterState["NonBoldOnly"] = "nonBoldOnly";
})(FilterState || (FilterState = {}));
class RateYourMusicBoldFilter {
    constructor() {
        this.filterState = FilterState.Off;
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
    `);
    }
    createContainer() {
        const wrapper = document.createElement("div");
        const insertBefore = document.querySelector("." + INSERT_CONTAINER_BEFORE_CLASS);
        wrapper.setAttribute("id", WRAPPER_ID);
        const header = document.createElement('b');
        header.textContent = 'Bold Filter';
        wrapper.appendChild(header);
        const radioGroup = this.createRadioGroup();
        wrapper.appendChild(radioGroup);
        if (insertBefore) {
            const { parentNode } = insertBefore;
            parentNode === null || parentNode === void 0 ? void 0 : parentNode.insertBefore(wrapper, insertBefore);
        }
    }
    createFakeChartItem() {
        const alreadyExists = !!document.querySelector(`.${FAKE_CHART_ITEM_CLASS}`);
        if (alreadyExists) {
            return;
        }
        const wrapper = document.createElement('div');
        wrapper.classList.add(ITEM_CLASS, FAKE_CHART_ITEM_CLASS, FILTERED_CLASS);
        wrapper.textContent = 'Bold Filter: Nothing to see here!';
        const parent = document.getElementById(SECTION_ID);
        parent === null || parent === void 0 ? void 0 : parent.appendChild(wrapper);
    }
    createPaginationObserver() {
        const node = document.getElementById('page_charts_section_charts');
        const observeConfig = { childList: true, subtree: true };
        const callback = () => {
            this.createFakeChartItem();
            const checked = document.querySelector(`input[name=${RADIO_GROUP_NAME}]:checked`);
            if (checked) {
                this.refilter(checked.value);
            }
        };
        const observer = new MutationObserver(callback);
        observer.observe(node, observeConfig);
        return observer;
    }
    createRadioGroup() {
        const wrapper = document.createElement('fieldset');
        const off = this.createRadioInput(RADIO_GROUP_NAME, FilterState.Off, 'Off');
        const onlyBold = this.createRadioInput(RADIO_GROUP_NAME, FilterState.BoldOnly, 'Show Only Bolds');
        const onlyNonBold = this.createRadioInput(RADIO_GROUP_NAME, FilterState.NonBoldOnly, 'Show Only Non-Bolds');
        wrapper.appendChild(off);
        wrapper.appendChild(onlyBold);
        wrapper.appendChild(onlyNonBold);
        return wrapper;
    }
    createRadioInput(name, value, displayValue) {
        const wrapper = document.createElement('div');
        const input = document.createElement('input');
        input.setAttribute('type', 'radio');
        input.setAttribute('name', name);
        input.setAttribute('id', value);
        input.setAttribute('value', value);
        const checked = value === this.filterState;
        if (checked) {
            input.checked = true;
        }
        input.addEventListener('click', (ev) => {
            const state = ev.target.value;
            this.refilter(state);
            GM.setValue(FILTER_STATE_KEY, state);
        });
        const label = document.createElement('label');
        label.setAttribute('for', value);
        label.textContent = displayValue;
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
        return [...document.querySelectorAll(`.${RELEASE_CLASS}`)];
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
        releases.forEach(release => {
            const shouldHide = this.isBold(release);
            this.applyClass(release, shouldHide, FILTERED_CLASS);
        });
    }
    unfilter() {
        this.getReleases().forEach(release => release.classList.remove(FILTERED_CLASS));
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
        const showFakeChartItem = releases.every(release => release.classList.contains(FILTERED_CLASS) || release.classList.contains(FAKE_CHART_ITEM_CLASS));
        this.applyClass(fakeChartItem, showFakeChartItem, FORCE_DISPLAY_BLOCK_CLASS);
    }
    main() {
        return __awaiter(this, void 0, void 0, function* () {
            this.addStyles();
            this.filterState = yield GM.getValue(FILTER_STATE_KEY, FilterState.Off);
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