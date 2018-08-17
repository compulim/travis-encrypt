import { css } from 'glamor';
import React, { Component } from 'react';
import JSEncrypt from 'jsencrypt';

const ROOT_CSS = css({
  fontFamily: 'sans-serif',

  '& > dl': {
    '& > label > dd, & > dd': {
      marginLeft: 0,

      '& > input[type="text"]': {
        fontFamily: 'monospace',
        fontSize: '200%',
        padding: 5,
        width: '50%'
      }
    },

    '& > label:not(:first-child) > dt, & > dt:not(:first-child)': {
      marginTop: '1em'
    },

    '& > dd > button': {
      marginTop: '.5em'
    },

    '& > dd > textarea': {
      height: '15em',
      width: '50%'
    }
  }
});

const GITHUB_RIBBON_CSS = css({
  border: 0,
  position: 'absolute',
  right: 0,
  top: 0
});

class App extends Component {
  constructor(props) {
    super(props);

    this.cipherTextRef = React.createRef();
    this.copyButtonRef = React.createRef();
    this.plainTextRef = React.createRef();

    this.handleCopyClick = this.handleCopyClick.bind(this);
    this.handlePlainTextChange = this.handlePlainTextChange.bind(this);
    this.handleRepoChange = this.handleRepoChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleUserChange = this.handleUserChange.bind(this);

    this.state = {
      busy: false,
      cipherText: '',
      copied: false,
      error: null,
      plainText: '',
      repo: window.localStorage.getItem('GITHUB_REPO') || '',
      user: window.localStorage.getItem('GITHUB_USER') || 'compulim',
    };
  }

  handleCopyClick() {
    const { current } = this.cipherTextRef;

    if (!current) {
      return;
    }

    current.select();
    document.execCommand('copy');

    this.setState(
      () => ({ copied: true }),
      () => {
        const { current } = this.plainTextRef;

        if (current) {
          current.focus();
          current.select();
        }
      }
    );
  }

  handlePlainTextChange({ target: { value } }) {
    this.setState(() => ({ plainText: value }));
  }

  handleRepoChange({ target: { value } }) {
    window.localStorage.setItem('GITHUB_REPO', value);
    this.setState(() => ({ repo: value }));
  }

  handleSubmit(event) {
    event.preventDefault();

    this.setState(
      () => ({ busy: true, cipherText: '', copied: false, error: null }),
      async () => {
        try {
          const { state } = this;
          const url = `https://api.travis-ci.org/repos/${ encodeURI(state.user) }/${ encodeURI(state.repo) }/key`;

          const res = await fetch(url);

          if (!res.ok) {
            throw new Error(`Server returned ${ res.status }`);
          }

          const { key } = await res.json();
          const encrypt = new JSEncrypt();

          encrypt.setPublicKey(key);

          const cipherText = encrypt.encrypt(state.plainText);

          this.setState(
            () => ({ busy: false, cipherText }),
            () => {
              const { current } = this.copyButtonRef;

              current && current.focus();
            }
          );
        } catch (err) {
          this.setState(() => ({ busy: false, error: err.messeage }));
        }
      }
    );
  }

  handleUserChange({ target: { value } }) {
    this.setState(() => ({ user: value }));
  }

  render() {
    const { state } = this;

    return (
      <form
        className={ ROOT_CSS }
        onSubmit={ this.handleSubmit }
      >
        <h1>travis-encrypt</h1>
        <a href="https://github.com/compulim/travis-encrypt">
          <img
            alt="Fork me on GitHub"
            className={ GITHUB_RIBBON_CSS }
            src="https://s3.amazonaws.com/github/ribbons/forkme_right_gray_6d6d6d.png"
          />
        </a>
        <dl>
          <label>
            <dt>GitHub username:</dt>
            <dd>
              <input
                onChange={ this.handleUserChange }
                type="text"
                value={ state.user }
              />
            </dd>
          </label>
          <label>
            <dt>GitHub repository:</dt>
            <dd>
              <input
                onChange={ this.handleRepoChange }
                type="text"
                value={ state.repo }
              />
            </dd>
          </label>
          <label>
            <dt>Plain text:</dt>
            <dd>
              <input
                autoFocus={ true }
                onChange={ this.handlePlainTextChange }
                ref={ this.plainTextRef }
                type="text"
                value={ state.plainText }
              />
            </dd>
          </label>
          <dd>
            <button
              disabled={ state.busy || !state.user || !state.repo || !state.plainText }
            >
              { state.busy ? 'Encrypting...' : 'Encrypt' }
            </button>
          </dd>
          <dt>Ciphertext</dt>
          <dd>
            <textarea
              disabled={ !state.cipherText }
              readOnly={ true }
              ref={ this.cipherTextRef }
              value={ state.cipherText }
            />
          </dd>
          <dd>
            <button
              disabled={ !state.cipherText }
              onClick={ this.handleCopyClick }
              ref={ this.copyButtonRef }
              type="button"
            >
              { state.copied ? 'Copied!' : 'Copy' }
            </button>
          </dd>
          {
            state.error &&
              <React.Fragment>
                <dt>Error</dt>
                <dd>{ state.error }</dd>
              </React.Fragment>
          }
        </dl>
      </form>
    );
  }
}

export default App;
