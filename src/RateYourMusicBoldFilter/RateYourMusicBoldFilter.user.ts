import { createStylesheet, getNextSibling } from 'userscript-utils';

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

  countVisibleReleases(releases: HTMLDivElement[]): number {
    return releases.filter((release) => !release.classList.contains(DISPLAY_NONE_CLASS)).length;
  }

  createCheckbox(): void {
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

    insertAfter?.append(wrapper);

    checkbox.addEventListener('change', (event: Event) => {
      const isChecked = (<HTMLInputElement>event?.target)?.checked;
      this.refilter(isChecked);
    });
  }

  createRefilterObserver(node: HTMLElement): MutationObserver {
    const observeConfig: MutationObserverInit = { childList: true };

    const callback: MutationCallback = () => {
      this.refilter(this.isCheckboxChecked());
    };

    const observer = new MutationObserver(callback);
    observer.observe(node, observeConfig);

    return observer;
  }

  isCheckboxChecked(): boolean {
    const checkbox = document.getElementById(CHECKBOX_ID) as HTMLInputElement;

    return checkbox.checked;
  }

  getReleases(root: Document | HTMLElement = document): HTMLDivElement[] {
    return [...root.getElementsByClassName(RELEASE_CLASS)] as HTMLDivElement[];
  }

  getSectionTops(): HTMLDivElement[] {
    return [...document.getElementsByClassName(SECTION_TOP_CLASS)] as HTMLDivElement[];
  }

  isBold(release: HTMLDivElement): boolean {
    return !!release.querySelector('.' + BOLD_CLASS);
  }

  filterBolds(): void {
    this.getReleases().filter(release => !this.isBold(release)).forEach(release => {
      release.classList.add(DISPLAY_NONE_CLASS)
    });
  }

  unfilterBolds() {
    this.getReleases().forEach((release) => release.classList.remove(DISPLAY_NONE_CLASS));
  }

  refilter(isCheckboxChecked: boolean): void {
    if (isCheckboxChecked) {
      this.filterBolds();
    } else {
      this.unfilterBolds();
    }

    this.showOrHideSections(isCheckboxChecked);
  }

  showOrHideSections(isCheckboxChecked: boolean) {
    const tops = this.getSectionTops();

    tops.forEach((top) => {
      const typeDiv = getNextSibling(top, TYPE_REGEX) as HTMLDivElement;
      const headerDiv = getNextSibling(top, HEADER_REGEX) as HTMLDivElement;
      const showingDiv = top.querySelector(SHOWING_SELECTOR) as HTMLDivElement;

      const releasesUnderHeader = this.getReleases(typeDiv);
      const count = this.countVisibleReleases(releasesUnderHeader);
      const isEmpty = count === 0;

      const showAllLink = top.querySelector(`.${SHOW_ALL_LINK_SELECTOR}`) as HTMLSpanElement;
      const showAllButton = typeDiv.querySelector(`.${SHOW_ALL_SELECTOR}`) as HTMLButtonElement;

      const divsToShowOrHideIfEmpty: HTMLElement[] = [top, typeDiv, headerDiv];
      const divsToShowOrHideIfCheckboxChecked: HTMLElement[] = [showAllLink, showAllButton];
      const divsToShowOrHide: HTMLElement[] = [...divsToShowOrHideIfEmpty, ...divsToShowOrHideIfCheckboxChecked];

      const hide = (div: HTMLElement): boolean => {
        return (
          (divsToShowOrHideIfEmpty.includes(div) && isEmpty) ||
          (divsToShowOrHideIfCheckboxChecked.includes(div) && isCheckboxChecked)
        );
      };

      divsToShowOrHide.forEach((div) => {
        if (div) {
          hide(div) ? div?.classList.add(DISPLAY_NONE_CLASS) : div?.classList.remove(DISPLAY_NONE_CLASS);
        }
      });

      if (!isEmpty) {
        this.updateShowingCount(showingDiv, count);
      }
    });
  }

  updateShowingCount(showingDiv: HTMLDivElement, newCount: number): void {
    const span = showingDiv.querySelector(HEADER_SHOWING_SELECTOR) as HTMLElement;

    if (!span) {
      return;
    }

    const { innerText } = span;
    const matches = [...innerText.matchAll(SHOWING_REGEX)];
    const total = parseInt(matches[matches.length - 1] as unknown as string, 10);

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

  main(): void {
    this.addStyles();
    this.createCheckbox();
    this.observeSorts();
  }
}

const instance = new RateYourMusicBoldFilter();

window.addEventListener('load', () => instance.main());