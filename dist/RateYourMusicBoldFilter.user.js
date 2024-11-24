// ==UserScript==
// @name          Rate Your Music bold filter
// @description   Adds a checkbox to RYM artist pages to show only bolded works
// @match         https://rateyourmusic.com/artist/*
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

;// ./node_modules/userscript-utils/dist/src/sibling/getNextSibling.js
// also from gomakethings.com
// modified to accept regex
function getNextSibling(elem, selector) {
    // Get the next sibling element
    var sibling = elem.nextElementSibling;
    // If there's no selector, return the first sibling
    if (!selector)
        return sibling;
    // If the sibling matches our selector, use it
    // If not, jump to the next sibling and continue the loop
    while (sibling) {
        if (selector instanceof RegExp && (selector.test(sibling.className) || selector.test(sibling.id))) {
            return sibling;
        }
        if (typeof selector === 'string' && sibling.matches(selector)) {
            return sibling;
        }
        sibling = sibling.nextElementSibling;
    }
}

;// ./src/RateYourMusicBoldFilter/RateYourMusicBoldFilter.user.ts

const RELEASE_CLASS = 'disco_release';
const BOLD_CLASS = 'disco_mainline_recommended';
const DISPLAY_NONE_CLASS = 'display-none';
const INSERT_CHECKBOX_AFTER_CLASS = 'section_artist_page_section_nav';
const SECTION_TOP_CLASS = 'disco_header_top';
const TYPE_REGEX = /^disco_type_.*$/;
const HEADER_REGEX = /^disco_header_.*$/;
const HEADER_SHOWING_SELECTOR = `[id*="disco_header_showing"]`;
const SHOW_ALL_LINK_SELECTOR = 'disco_expand_section_link';
const SHOW_ALL_SELECTOR = 'disco_expand_section_btn';
const SHOWING_SELECTOR = `[class*="showing"]`;
const SHOWING_REGEX = /\d+/g;
const CHECKBOX_ID = 'showOnlyBolds';
const WRAPPER_ID = `${CHECKBOX_ID}_container`;
const DISCOGRAPHY_ID = 'discography';
class RateYourMusicBoldFilter {
    // puts all of the styles on the page that we need for the rest of the script
    addStyles() {
        createStylesheet(`
        .${DISPLAY_NONE_CLASS} {
            display: none;
        }

        #${CHECKBOX_ID}_container {
          margin-top: 1em;
          display: inline-block;
        }

        #${CHECKBOX_ID}, #${CHECKBOX_ID}+label {
            margin-right: 0.5em; 
            vertical-align: middle;
        }
    `);
    }
    countVisibleReleases(releases) {
        return releases.filter((release) => !release.classList.contains(DISPLAY_NONE_CLASS)).length;
    }
    createCheckbox() {
        const wrapper = document.createElement('div');
        const checkbox = document.createElement('input');
        checkbox.setAttribute('id', CHECKBOX_ID);
        checkbox.setAttribute('type', 'checkbox');
        const label = document.createElement('label');
        label.setAttribute('for', CHECKBOX_ID);
        label.innerText = 'Show Only Bolds';
        wrapper.setAttribute('id', WRAPPER_ID);
        wrapper.append(checkbox, label);
        const insertAfter = document.querySelector('.' + INSERT_CHECKBOX_AFTER_CLASS);
        insertAfter === null || insertAfter === void 0 ? void 0 : insertAfter.append(wrapper);
        checkbox.addEventListener('change', (event) => {
            var _a;
            const isChecked = (_a = event === null || event === void 0 ? void 0 : event.target) === null || _a === void 0 ? void 0 : _a.checked;
            this.refilter(isChecked);
        });
    }
    createRefilterObserver(node) {
        const observeConfig = { childList: true };
        const callback = () => {
            this.refilter(this.isCheckboxChecked());
        };
        const observer = new MutationObserver(callback);
        observer.observe(node, observeConfig);
        return observer;
    }
    isCheckboxChecked() {
        const checkbox = document.getElementById(CHECKBOX_ID);
        return checkbox.checked;
    }
    getReleases(root = document) {
        return [...root.getElementsByClassName(RELEASE_CLASS)];
    }
    getSectionTops() {
        return [...document.getElementsByClassName(SECTION_TOP_CLASS)];
    }
    isBold(release) {
        return !!release.querySelector('.' + BOLD_CLASS);
    }
    filterBolds() {
        this.getReleases().filter(release => !this.isBold(release)).forEach(release => {
            release.classList.add(DISPLAY_NONE_CLASS);
        });
    }
    unfilterBolds() {
        this.getReleases().forEach((release) => release.classList.remove(DISPLAY_NONE_CLASS));
    }
    refilter(isCheckboxChecked) {
        if (isCheckboxChecked) {
            this.filterBolds();
        }
        else {
            this.unfilterBolds();
        }
        this.showOrHideSections(isCheckboxChecked);
    }
    showOrHideSections(isCheckboxChecked) {
        const tops = this.getSectionTops();
        tops.forEach((top) => {
            const typeDiv = getNextSibling(top, TYPE_REGEX);
            const headerDiv = getNextSibling(top, HEADER_REGEX);
            const showingDiv = top.querySelector(SHOWING_SELECTOR);
            const releasesUnderHeader = this.getReleases(typeDiv);
            const count = this.countVisibleReleases(releasesUnderHeader);
            const isEmpty = count === 0;
            const showAllLink = top.querySelector(`.${SHOW_ALL_LINK_SELECTOR}`);
            const showAllButton = typeDiv.querySelector(`.${SHOW_ALL_SELECTOR}`);
            const divsToShowOrHideIfEmpty = [top, typeDiv, headerDiv];
            const divsToShowOrHideIfCheckboxChecked = [showAllLink, showAllButton];
            const divsToShowOrHide = [...divsToShowOrHideIfEmpty, ...divsToShowOrHideIfCheckboxChecked];
            const hide = (div) => {
                return ((divsToShowOrHideIfEmpty.includes(div) && isEmpty) ||
                    (divsToShowOrHideIfCheckboxChecked.includes(div) && isCheckboxChecked));
            };
            divsToShowOrHide.forEach((div) => {
                if (div) {
                    hide(div) ? div === null || div === void 0 ? void 0 : div.classList.add(DISPLAY_NONE_CLASS) : div === null || div === void 0 ? void 0 : div.classList.remove(DISPLAY_NONE_CLASS);
                }
            });
            if (!isEmpty) {
                this.updateShowingCount(showingDiv, count);
            }
        });
    }
    updateShowingCount(showingDiv, newCount) {
        const span = showingDiv.querySelector(HEADER_SHOWING_SELECTOR);
        if (!span) {
            return;
        }
        const { innerText } = span;
        const matches = [...innerText.matchAll(SHOWING_REGEX)];
        const total = parseInt(matches[matches.length - 1], 10);
        if (total) {
            span.innerText = newCount === total ? `Showing all (${total})` : `Showing ${newCount} of ${total}`;
        }
    }
    observeSorts() {
        const discography = document.getElementById(DISCOGRAPHY_ID);
        if (!discography) {
            return;
        }
        this.createRefilterObserver(discography);
    }
    main() {
        this.addStyles();
        this.createCheckbox();
        this.observeSorts();
    }
}
const instance = new RateYourMusicBoldFilter();
window.addEventListener('load', () => instance.main());

/******/ })()
;