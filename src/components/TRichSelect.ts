import TRichSelectType from '@/types/TRichSelect';
import { CreateElement, VNode } from 'vue';
import cloneDeep from 'lodash/cloneDeep';
import InputWithOptions from '@/base/InputWithOptions';
import NormalizedOption from '../types/NormalizedOption';
import NormalizedOptions from '../types/NormalizedOptions';
import TRichSelectRenderer from '../renderers/TRichSelectRenderer';

const TRichSelect = InputWithOptions.extend({
  name: 'TRichSelect',

  render(createElement: CreateElement) {
    const createSelectFunc: (createElement: CreateElement) => VNode = this.createSelect;
    return createSelectFunc(createElement);
  },

  props: {
    value: {
      type: [String, Number],
      default: null,
    },
    hideSearchBox: {
      type: Boolean,
      default: false,
    },
    openOnFocus: {
      type: Boolean,
      default: true,
    },
    clearable: {
      type: Boolean,
      default: false,
    },
    placeholder: {
      type: String,
      default: undefined,
    },
    searchBoxPlaceholder: {
      type: String,
      default: 'Search...',
    },
    noResultsLabel: {
      type: String,
      default: 'No results found',
    },
    maxHeight: {
      type: [String, Number],
      default: 300,
    },
    classes: {
      type: Object,
      default() {
        return {
          wrapper: 'relative',
          buttonWrapper: 'inline-block w-full',
          selectButton: 'w-full border bg-white flex text-left justify-between items-center rounded p-2 text-gray-500',
          selectButtonLabel: 'block truncate text-gray-900',
          selectButtonPlaceholder: 'block truncate text-gray-500',
          selectButtonIcon: 'fill-current flex-shrink-0 ml-1 h-4 w-4',
          selectButtonClearIconWrapper: 'hover:bg-gray-200 rounded flex h-5 w-5 flex-shrink-0 items-center justify-center ml-1 ',
          selectButtonClearIcon: 'fill-current h-3 w-3 text-gray-500',
          dropdown: 'absolute w-full rounded-md bg-white shadow-lg z-10',
          dropdownFeedback: 'p-2 text-base leading-6 focus:outline-none sm:text-sm sm:leading-5',
          optionsList: 'py-1 text-base leading-6 overflow-auto focus:outline-none sm:text-sm sm:leading-5',
          searchWrapper: 'inline-block w-full bg-white p-2',
          searchBox: 'inline-block w-full p-2 bg-gray-200 focus:outline-none text-sm rounded',
          optgroup: 'text-gray-500 uppercase text-xs py-1 px-2 font-semibold',
          option: 'cursor-default select-none relative p-2 text-gray-900',
          highlightedOption: 'cursor-default select-none relative p-2 text-gray-900 bg-gray-300',
          selectedOption: 'cursor-default select-none relative p-2 text-gray-900 font-semibold bg-gray-100',
          selectedHighlightedOption: 'cursor-default select-none relative p-2 text-gray-900 bg-gray-300 font-semibold',
          optionContent: 'flex justify-between items-center',
          optionLabel: 'truncate block',
          selectedIcon: 'fill-current h-4 w-4',
        };
      },
    },
  },

  data() {
    return {
      hasFocus: false,
      show: false,
      localValue: this.value as string | number | boolean | symbol | null,
      highlighted: null as number | null,
      query: '',
      filteredOptions: [] as NormalizedOptions,
      selectedOption: undefined as undefined | NormalizedOption,
    };
  },

  created() {
    this.selectedOption = this.findOptionByValue(this.value);
  },

  watch: {
    normalizedOptions: {
      handler(options: NormalizedOptions) {
        this.filteredOptions = options;
      },
      immediate: true,
    },
    query() {
      const options = cloneDeep(this.normalizedOptions);
      this.filteredOptions = this.filterOptions(options);

      if (this.filteredOptions.length) {
        this.highlighted = 0;
      } else {
        this.highlighted = null;
      }
    },
    async localValue(localValue: string | null) {
      this.selectedOption = this.findOptionByValue(localValue);

      const value = this.selectedOption ? this.selectedOption.value : undefined;

      this.$emit('input', value);

      await this.$nextTick();

      this.$emit('change', value);

      this.show = false;
    },
    value(value) {
      this.localValue = value;
    },
    async show(show) {
      if (show) {
        if (!this.hideSearchBox) {
          await this.$nextTick();
          this.getSearchBox().focus();
        }

        if (!this.filteredflattenedOptions.length) {
          this.highlighted = null;
          return;
        }

        this.highlighted = this.selectedOptionIndex || 0;
      }
    },
  },

  computed: {
    filteredflattenedOptions(): NormalizedOptions {
      return this.filteredOptions.map((option: NormalizedOption) => {
        if (option.children) {
          return option.children;
        }

        return option;
      }).flat();
    },

    normalizedHeight(): string {
      if (/^\d+$/.test(String(this.maxHeight))) {
        return `${this.maxHeight}px`;
      }

      return String(this.maxHeight);
    },
    selectedOptionIndex(): number | undefined {
      if (!this.selectedOption) {
        return undefined;
      }
      const index = this.flattenedOptions
        .findIndex((option) => this.optionHasValue(option, this.localValue));
      return index >= 0 ? index : undefined;
    },
  },

  methods: {
    // eslint-disable-next-line max-len
    findOptionByValue(value: string | number | boolean | symbol | null): undefined | NormalizedOption {
      return this.flattenedOptions
        .find((option) => this.optionHasValue(option, value));
    },
    // eslint-disable-next-line max-len
    optionHasValue(option: NormalizedOption, value: string | number | boolean | symbol | null): boolean {
      return Array.isArray(value)
        ? value.includes(option.value)
        : value === option.value;
    },
    createSelect(createElement: CreateElement) {
      return (new TRichSelectRenderer(createElement, this as TRichSelectType))
        .render();
    },
    filterOptions(options: NormalizedOptions) {
      if (!this.query) {
        return options;
      }

      return options
        .map((option: NormalizedOption) => {
          if (option.children) {
            const newOption = option;
            // eslint-disable-next-line no-param-reassign
            newOption.children = this.filterOptions(newOption.children as NormalizedOptions);
          }
          return option;
        }).filter((option: NormalizedOption) => {
          const foundText = String(option.text)
            .toUpperCase()
            .trim()
            .includes(this.query.toUpperCase().trim());

          const hasChildren = option.children && option.children.length > 0;

          return hasChildren || foundText;
        });
    },

    hideOptions() {
      this.show = false;
    },
    showOptions() {
      this.show = true;
    },
    toggleOptions() {
      if (this.show) {
        this.hideOptions();
      } else {
        this.showOptions();
      }
    },
    blurHandler(e: FocusEvent) {
      this.hasFocus = false;
      this.hideOptions();
      this.$emit('blur', e);
    },
    focusHandler(e: FocusEvent) {
      this.hasFocus = true;
      if (this.openOnFocus) {
        this.showOptions();
      }
      this.$emit('focus', e);
    },
    clickHandler(e: FocusEvent) {
      if (!this.show && !this.hasFocus) {
        this.getButton().focus();
        if (!this.openOnFocus) {
          this.showOptions();
        }
      } else {
        this.toggleOptions();
      }
      this.$emit('click', e);
    },
    async arrowUpHandler(e: KeyboardEvent) {
      e.preventDefault();

      if (!this.show) {
        this.showOptions();
        return;
      }

      if (this.highlighted === null) {
        this.highlighted = 0;
      } else {
        this.highlighted = this.highlighted - 1 < 0
          ? this.filteredflattenedOptions.length - 1
          : this.highlighted - 1;
      }

      this.scrollToOptionIndex(this.highlighted);
    },
    arrowDownHandler(e: KeyboardEvent) {
      e.preventDefault();

      if (!this.show) {
        this.showOptions();
        return;
      }

      if (this.highlighted === null) {
        this.highlighted = 0;
      } else {
        this.highlighted = this.highlighted + 1 >= this.filteredflattenedOptions.length
          ? 0
          : this.highlighted + 1;
      }

      this.scrollToOptionIndex(this.highlighted);
    },
    scrollToOptionIndex(index: number) {
      if (this.$refs.optionsList) {
        const list = this.$refs.optionsList as HTMLUListElement;
        const li = list.querySelectorAll('li[data-type=option]')[index] as HTMLLIElement;
        if (li.scrollIntoView) {
          li.scrollIntoView({ block: 'nearest' });
        }
      }
    },
    enterHandler(e: KeyboardEvent) {
      if (!this.show) {
        return;
      }

      if (this.highlighted !== null) {
        e.preventDefault();
        const option = this.filteredflattenedOptions[this.highlighted];
        this.selectOption(option);
      }
    },
    searchInputHandler(e: Event): void {
      const target = (e.target as HTMLInputElement);
      this.query = target.value;
    },
    getButton() {
      return this.$refs.selectButton as HTMLButtonElement;
    },
    getSearchBox() {
      return this.$refs.searchBox as HTMLInputElement;
    },
    async selectOption(option: NormalizedOption) {
      if (this.localValue !== option.value) {
        (this.localValue as string | number | boolean | symbol | null) = option.value;
      }
      await this.$nextTick();
      this.getButton().focus();
      this.hideOptions();
      this.query = '';
    },
    clearIconClickHandler(e: MouseEvent): void {
      e.preventDefault();
      e.stopPropagation();
      (this.localValue as string | number | boolean | symbol | null) = null;
    },

    blur() {
      const el = this.hideSearchBox
        ? this.$refs.selectButton as HTMLButtonElement
        : this.$refs.searchBox as HTMLInputElement;
      el.blur();
    },

    focus(options?: FocusOptions | undefined) {
      const el = this.$refs.selectButton as HTMLButtonElement;
      el.focus(options);
    },
  },
});


export default TRichSelect;