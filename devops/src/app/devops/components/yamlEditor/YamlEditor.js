import React, { Component, Fragment } from "react";
import { injectIntl } from "react-intl";
import PropTypes from "prop-types";
import { Icon } from "choerodon-ui";
import JsYaml from "js-yaml";
import "codemirror/addon/merge/merge.css";
import "codemirror/lib/codemirror.css";
import "codemirror/addon/lint/lint.css"
import "./theme-chd.css";
import CodeMirror from "./editor/CodeMirror";
import "codemirror/addon/lint/lint.js";
import "./index.scss";
import "./yaml-lint";
import "./yaml-mode";
import "./merge";

/**
 * YAML 格式校验
 * @param values
 * @returns {Array}
 */
function parse(values) {
  const result = [];

  try {
    JsYaml.load(values);
  } catch (e) {
    result.push(e);
  }

  return result;
}

class YamlEditor extends Component {
  static propTypes = {
    value: PropTypes.string.isRequired,
    originValue: PropTypes.string,
    readOnly: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
    options: PropTypes.object,
    handleEnableNext: PropTypes.func,
    onValueChange: PropTypes.func,
  };

  static defaultProps = {
    readOnly: true,
    handleEnableNext: enable => {
    },
    onValueChange: () => {
    },
  };

  constructor(props) {
    super(props);
    this.state = {
      errorTip: false,
      yamlValue: "",
    };
    this.options = {
      // chd 自定制的主题配色
      theme: "chd",
      mode: "text/chd-yaml",
      readOnly: props.readOnly,
      lineNumbers: true,
      lineWrapping: true,
      viewportMargin: Infinity,
      lint: !props.readOnly,
      gutters: !props.readOnly ? ["CodeMirror-lint-markers"] : [],
    };
  }

  componentDidMount() {
    const { value, onValueChange } = this.props;
    this.checkYamlFormat(value);
    // 初始化组件时设置值
    onValueChange(value);
  }

  onChange = value => {
    const { onValueChange } = this.props;
    this.checkYamlFormat(value);
    onValueChange(value);
    this.setState({ yamlValue: value });
  };

  /**
   * 校验Yaml格式
   * 校验规则来源 https://github.com/nodeca/js-yaml
   * @param {*} values
   */
  checkYamlFormat(values) {
    const HAS_ERROR = true;
    const NO_ERROR = false;

    // 通知父组件内容格式是否有误
    const { handleEnableNext } = this.props;

    let errorTip = NO_ERROR;
    // yaml 格式校验结果
    const formatResult = parse(values);
    if (formatResult && formatResult.length) {
      errorTip = HAS_ERROR;
      handleEnableNext(HAS_ERROR);
    } else {
      errorTip = NO_ERROR;
      handleEnableNext(NO_ERROR);
    }

    // 显示编辑器下方的错误 tips
    this.setState({ errorTip });
  }

  render() {
    // originValue 用做merge对比的源数据
    const {
      intl: { formatMessage },
      originValue,
      value,
    } = this.props;
    const { errorTip, yamlValue } = this.state;

    return (
      <Fragment>
        <div className="c7ncd-yaml-wrapper">
          <CodeMirror
            options={this.options}
            value={yamlValue || value}
            originValue={originValue}
            onChange={this.onChange}
            ref={instance => {
              this.yamlEditor = instance
            }}
          />
        </div>
        {errorTip ? (
          <div className="c7ncd-yaml-error">
            <Icon type="error" className="c7ncd-yaml-error-icon" />
            <span className="c7ncd-yaml-error-msg">
              {formatMessage({ id: "yaml.error.tooltip" })}
            </span>
          </div>
        ) : null}
      </Fragment>
    );
  }
}

export default injectIntl(YamlEditor);
