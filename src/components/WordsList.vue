<template>
  <div class="container">
    <div class="add-one">
      <div class="text-input" @click="$refs.addOne.focus()">
        <input
          ref="addOne"
          v-model="oneText"
          type="text"
          class="add-one-input"
          placeholder="Add One"
          autocapitalize="none"
          @keydown.enter="addOne"
        >
        <label />
      </div>

      <button :disabled="!oneText" class="add-one-btn" @click="addOne">
        <span>
          Add One
        </span>
      </button>
    </div>

    <div class="list">
      <div class="list-border">
        <div class="separator" :class="{'show-custom': customToggle}">
          <div class="options">
            <h3>Separator:</h3>

            <label
              v-for="(separator, index) in separatorOptions"
              :key="index"
              tabindex="-1"
              :class="{selected: separatorText === separator[0]}"
              class="radio"
            >
              <input
                v-model="separatorText"
                type="radio"
                :value="separator[0]"
                name="separator"
              >
              <span v-html="separator[1]" />
            </label>
            <label
              tabindex="-1"
              :class="{selected: customToggle, waiting: customToggle && !customSeparatorText.length}"
              class="radio custom-separator-label"
            >
              <input
                v-model="customToggle"
                type="checkbox"
              >
              <span>Custom</span>
            </label>
          </div>
          <div class="custom-separator-wrapper">
            <input
              ref="customSeparatorInput"
              v-model="customSeparatorText"
              type="text"
              maxlength="9"
              placeholder="ex. / &quot; '"
            >
            <label :class="{selected: separatorText === customSeparatorText || separatorText === 'custom'}" />
            <button v-show="history.length" class="undo" @click="undo">
              Undo
            </button>
          </div>
        </div>

        <textarea
          ref="textArea"
          v-model="listText"
          spellcheck="false"
        />
      </div>

      <div class="buttons">
        <button @click="overwrite">
          <span>
            {{ list.length ? 'Overwrite' : 'Set' }}
          </span>
        </button>
        <button @click="append">
          <span>
            Append
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

const sleep = (t) => new Promise((resolve) => setTimeout(resolve, t));
// const sleep = () => new Promise((resolve) => setTimeout(resolve, 50));

export default {
  name: 'WordsList',
  data() {
    return {
      list: [],
      listText: '',
      oneText: '',
      separatorOptions: [
        [',', '<svg xmlns="http://www.w3.org/2000/svg" width="16pt" height="16pt" viewBox="0 0 36 36" version="1.1"><path d="M 10.5 4.5 L 25.425781 4.5 L 25.425781 19.441406 L 19.425781 31.410156 L 12 31.410156 L 17.953125 19.441406 L 10.5 19.441406 Z M 10.5 4.5 "/></svg>'],
        [';', '<svg xmlns="http://www.w3.org/2000/svg" width="36pt" height="36pt" viewBox="0 0 36 90" version="1.1"><path d="M 28.996094 47.820312 L 28.996094 62.761719 L 22.996094 74.730469 L 15.554688 74.730469 L 21.511719 62.761719 L 14.070312 62.761719 L 14.070312 47.820312 Z M 28.996094 47.820312 "/><path d="M 18.75 21.96875 L 9.901042 21.96875 L 9.901042 13.200521 L 18.739583 13.200521 L 18.739583 21.979167 Z M 18.75 21.96875 " transform="matrix(1.5,0,0,1.5,0,0)"/></svg>'],
        ['\n', '<svg xmlns="http://www.w3.org/2000/svg" width="24pt" height="24pt" viewBox="0 0 36 36" version="1.1"><path d="M 32.175781 8.515625 L 32.175781 16.089844 L 7.191406 16.089844 L 14.007812 9.277344 L 11.355469 6.625 L 0 17.980469 L 11.355469 29.339844 L 14.007812 26.691406 L 7.191406 19.875 L 35.960938 19.875 L 35.960938 8.515625 Z M 32.175781 8.515625 "/></svg>'],
        [' ', '<svg xmlns="http://www.w3.org/2000/svg" width="24pt" height="8pt" viewBox="0 0 36 12" version="1.1"><path  d="M 31.5 8.667969 L 4.5 8.667969 L 4.5 0 L 0 0 L 0 13 L 36 13 L 36 0 L 31.5 0 Z M 31.5 8.667969 "/></svg>'],
      ],
      separatorText: ',',
      customToggle: false,
      customSeparatorText: '',
      used: [],
      history: [],
    };
  },
  watch: {
    async separatorText(current, previous) {
      if (current !== this.customSeparatorText && current.match(/^[,;\n ]$/)) {
        this.customToggle = false;
      }

      if (this.listText) {
        // console.warn('CONVERTING ', `'${previous}'`, `'${current}'`);

        this.listText = this.listToArray(previous).join(current);
        await sleep(400);

        if (!this.customToggle) {
          this.$refs.textArea.focus();
        }
      }
    },
    // eslint-disable-next-line no-unused-vars
    customSeparatorText(current, previous) {
      if (this.customToggle && current.length && !current.match(/^[,;\n ]$/)) {
        this.history.unshift({
          separatorText: this.separatorText,
          list: this.list,
        });
        this.separatorText = current;
      }
    },
    async customToggle(current) {
      if (current) {
        await sleep(300);
        this.$refs.customSeparatorInput.focus();
        if (this.customSeparatorText) {
          this.history.unshift({
            separatorText: this.separatorText,
            list: this.list,
          });
          this.separatorText = this.customSeparatorText;
        }
      } else {
        this.history = [];
      }
    },
    list() {
      this.emitUsed();
    },
  },
  mounted() {
    this.get();
  },
  methods: {
    listToArray(separator = this.separatorText) {
      return this.listText
        .split(separator)
        .map((text) => text.trim())
        .filter((text) => text.length);
    },
    convert(list, direction) {
      if (direction) {
        return list.map((text) => ({ text }));
      }
      return list.map((item) => item.text);
    },
    overwrite() {
      this.list = this.convert(this.listToArray(), true);
      this.updateList(this.listToArray(), true);
    },
    append() {
      const list = this.listToArray();
      this.updateList(list);
      this.listToText();
    },
    addOne() {
      const trimmed = this.oneText.trim();
      if (!trimmed.length) {
        return;
      }
      this.listText += (this.listText.length ? this.separatorText : '') + trimmed;
      this.updateList([trimmed]);
    },
    updateList(list, overWrite = false) {
      if (!overWrite) {
        this.list.push(...this.convert(list, true));
      }

      axios.post(`${process.env.VUE_APP_URL}/api/list`, { overWrite, list, separatorText: this.separatorText })
        .then(async () => {
          if (this.oneText.length) {
            await sleep(200);
            this.oneText = ''; // this sets focus too
            this.$refs.addOne.focus();
          } else {
            await sleep(500);
            this.$refs.textArea.focus();
          }
        });
    },
    get() {
      axios.get(`${process.env.VUE_APP_URL}/api/list`)
        .then((res) => {
          const separator = res.data.separatorText;
          if (separator.length) {
            if (separator.match(/^[,;\n ]$/)) {
              this.separatorText = res.data.separatorText;
            } else {
              this.customToggle = true;
              this.customSeparatorText = separator;
            }
          }
          if (res.data.list.length) {
            this.list = res.data.list;
            this.listToText();
            setInterval(this.getUsed, 1000 * 30);
          }
        });
    },
    listToText() {
      this.listText = this.convert(this.list, false).join(this.separatorText);
    },
    resetUsed() {
      this.list = this.list.map((item) => ({ text: item.text }));
      axios.post(`${process.env.VUE_APP_URL}/api/reset`)
        .then(() => {
          console.log('Reset ok');
        });
    },
    getUsed() {
      axios.get(`${process.env.VUE_APP_URL}/api/used`)
        .then(
          (res) => {
            if (res.data) {
              res.data.forEach((state, index) => {
                if (state) {
                  this.list[index].used = 1;
                }
              });
            }
          },
        );
    },
    emitUsed() {
      const payload = {
        usedCount: this.list.reduce((acc, item) => (item.used ? acc + 1 : acc), 0),
        listLength: this.list.length || null,
      };
      this.$emit('used', payload);
    },
    undo() {
      const snapshot = this.history.shift();
      this.list = snapshot.list;
      if (snapshot.separatorText.match(/^[,;\n ]$/)) {
        this.customToggle = false;
      }
      this.separatorText = snapshot.separatorText;
      this.$refs.customSeparatorInput.focus();
    },
  },
};
</script>


<style scoped lang="sass">
.container
  position: relative
  display: flex
  flex-direction: column

button:not(.undo)
  @include btn
  display: flex
  margin: 1em 0
  margin-right: 1em


.add-one
  height: min-content
  display: flex
  justify-content: space-between
  align-items: flex-end

  .text-input
    margin-right: 2em
    flex-grow: 1
    @include text-input(2px)

  button
    margin: 0


.list
  margin-top: 2em
  flex-grow: 1
  display: flex
  flex-direction: column


  .list-border
    flex-grow: 1
    display: flex
    flex-direction: column
    border: 2px solid $grey
    padding: 0.5em 0.5em

  .separator
    display: flex
    justify-content: flex-end
    align-items: center

    .options
      transform: translateX(10.5em) // + margin
      display: flex
      align-items: center
      transition: transform 0.5s cubic-bezier(.71,0,.65,.79)

      h3
        font-size: 1.25rem
        letter-spacing: 0.05em
        margin-right: 1em
        font-weight: normal
        color: $grey

      h3, label:not(:last-child)
        margin-right: 0.5em

      .radio input
        display: none

      label
        @include btn
        height: 2em
        width: 2em
        padding: 0.2em
        line-height: 0

        &:not(:focus) span
          transition: fill 0.2s 0.4s

        span
          transform: scale(0.7) !important

        &.selected:not(.waiting):not(:hover):not(:focus)
          span
            fill: $blue
            color: $blue

        &.waiting
          pointer-events: none

      .custom-separator-label
        width: min-content
        padding: 0 0.5em
        span
          transform: scale(1) !important

    .custom-separator-wrapper
      @include text-input(2px)
      pointer-events: none
      opacity: 0
      width: 10em
      position: relative
      margin-left: 0.5em
      transition: opacity 0.5s ease-in-out

      label
        padding: 0
        box-shadow: none

      input[type="text"]
        // margin-top: 0
        margin: 0.25em

      button
        background: none
        border: 2px solid $grey
        color: $grey
        padding: 0.2em 0.4em
        position: absolute
        right: 0.1em
        top: 0.2em

    &.show-custom
      .options
        transform: translateX(0)

      .custom-separator-wrapper
        transition-delay: 0.3s
        opacity: 1
        pointer-events: all

  textarea
    margin-top: 0.5em
    width: 100%
    flex-grow: 1
    color: white
    background: none
    font: inherit
    letter-spacing: 0.02em
    font-size: 1.2rem
    border: none
    resize: none

  .buttons
    display: flex
    width: 100%
    margin-top: 1em

    button
      flex-grow: 1
      margin: 0


    button:first-child
      margin-right: 4em

@media (max-width: 1170px)
  .add-one-btn
    white-space: nowrap
    overflow: hidden
  .separator
    .options
      transform: translateX(0) !important
    h3, .custom-separator-label, custom-separator-wrapper
      display: none

</style>
