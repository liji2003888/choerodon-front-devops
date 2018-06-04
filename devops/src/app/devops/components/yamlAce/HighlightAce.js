/**
 * yaml 编辑框的高亮效果
 */
import React, { Component } from 'react';
import ReactAce from 'react-ace-editor';
import ace from 'brace';
import PropTypes from 'prop-types';
import { Map, fromJS, getIn, toJS } from 'immutable';
import _ from 'lodash';
import './AceForYaml.scss';

const yaml = require('js-yaml');

const observableDiff = require('deep-diff').observableDiff;

const { Range } = ace.acequire('ace/range');

const jsdiff = require('diff');
/* eslint-disable react/no-string-refs */

class HighlightAce extends Component {
  static PropTypes = {
    value: PropTypes.object.isRequired,
    options: PropTypes.object.isRequired,
    highlightMarkers: PropTypes.object,
  };
  static defaultProps = {
    options: {
      gutter: false,
      readOnly: false,
      mode: 'yaml',
      theme: 'dawn',
      softWrap: false,
    },
  };
  constructor(props) {
    super(props);
    this.state = {
      isTriggerChange: false,
      height: '300px',
    };
  }

  componentDidMount() {
    // 第一次加载没有数据
    this.setOptions();
    const editor = this.ace.editor;
    if (this.props.value) {
      this.handleLoad();
      editor.clearSelection();
    }
    if (this.props.readOnly) {
      this.ace.editor.setReadOnly(true);
    }
    if (this.props.modifyMarkers) {
      Object.values(this.props.modifyMarkers).map((marker) => {
        if (marker.clazz === 'modifyHighlight-line' || marker.clazz === 'modifyHighlight') {
          editor.session.addMarker(marker.range, 'modifyHighlight-line', 'fullLine', false);
          editor.session.addMarker(marker.range, 'modifyHighlight', 'text', false);
        }
        return marker;
      });
    }
  }
  componentWillReceiveProps(nextProps) {
    if (nextProps.readOnly) {
      this.ace.editor.setReadOnly(true);
    }
  }
  onChange =_.debounce((values, options) => {
    const { isTriggerChange } = this.state;
    const editor = this.ace.editor;
    const lines = editor.session.getLength();
    const lineHeight = editor.renderer.lineHeight;
    const height = `${lines * lineHeight}px`;
    this.setState({ height });
    if (isTriggerChange) {
      const start = options.start;
      const end = options.end;
      const value = editor.session.getLine(start.row);
      const range = new Range(start.row, value.split(':')[0].length + 2, end.row, end.column);
      editor.session.addMarker(range, 'modifyHighlight-line', 'fullLine', false);
      editor.session.addMarker(range, 'modifyHighlight', 'text', false);
      const modifyMarkers = editor.session.getMarkers();
      this.props.onChange(values, modifyMarkers);
    } else {
      this.setState({ isTriggerChange: true });
    }
  }, 1000);
  setOptions =() => {
    const editor = this.ace.editor;
    // eslint-disable-next-line
    require('brace/mode/yaml');
    // eslint-disable-next-line
    require('brace/theme/dawn');

    editor.setPrintMarginColumn(0);
    editor.setHighlightGutterLine(false);
    editor.setWrapBehavioursEnabled(false);
    editor.getSession().setMode('ace/mode/yaml');
    editor.setTheme('ace/theme/dawn');
  };
  handleLoad =() => {
    const editor = this.ace.editor;
    this.setState({ isTriggerChange: false });
    editor.setValue(this.props.value);
    if (this.props.highlightMarkers && this.props.highlightMarkers.length) {
      this.handleHighLight();
    } else if (this.props.readOnly) {
      this.ace.editor.setReadOnly(true);
    }
  };
  /**
   * 设置高亮
   */
  handleHighLight = () => {
    const editor = this.ace.editor;
    const diff = this.props.highlightMarkers;
    diff.map((line) => {
      const range = new Range(line.line, line.startColumn, line.line, line.endColumn);
      editor.session.addMarker(range, 'lineHeight', 'fullLine', false);
      editor.session.addMarker(range, 'errorHighlight', 'text', false);
      return diff;
    });
  }

  render() {
    const { value, width, options, className, height } = this.props;
    return (
      <ReactAce
        className={className}
        value={value}
        showGutter={false}
        setOptions={options}
        onChange={this.onChange}
        style={{ height: height || '500px', width }}
        ref={(instance) => { this.ace = instance; }} // Let's put things into scope
      />
    );
  }
}

export default HighlightAce;
