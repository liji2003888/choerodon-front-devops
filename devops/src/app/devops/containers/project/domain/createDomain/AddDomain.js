import React, { Component } from 'react';
import { observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Button, Form, Select, Input, Modal, Tooltip } from 'choerodon-ui';
import { stores } from 'choerodon-front-boot';
import _ from 'lodash';
import '../../../main.scss';
import './CreateDomain.scss';

const Option = Select.Option;
const FormItem = Form.Item;
const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 100 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 26 },
  },
};
const Sidebar = Modal.Sidebar;
const { AppState } = stores;

@observer
class CreateDomain extends Component {
  constructor(props) {
    const menu = AppState.currentMenuType;
    super(props);
    this.state = {
      pathArr: [{ pathIndex: 0, networkIndex: 0 }],
      projectId: menu.id,
      show: false,
      0: { deletedService: [] },
      env: { loading: false, dataSource: [] },
      initServiceLen: 0,
    };
  }
  componentDidMount() {
    const { store, id, visible } = this.props;
    if (id && visible) {
      store.loadDataById(this.state.projectId, id)
        .then((data) => {
          this.setState({ SingleData: data });
          const len = data.pathList.length;
          for (let i = 0; i < len; i += 1) {
            const list = data.pathList[i];
            if (list.serviceStatus !== 'running') {
              this.setState({
                [i]: {
                  deletedService: [{
                    name: list.serviceName,
                    id: list.serviceId,
                    status: list.serviceStatus,
                  }] } });
            } else {
              this.setState({ [i]: { deletedService: [] } });
            }
          }
          this.setState({ initServiceLen: len });
          this.initPathArr(data.pathList.length);
          store.loadNetwork(this.state.projectId, data.envId);
        });
    }
    store.loadEnv(this.state.projectId)
      .then((data) => {
        this.setState({ env: { loading: false, dataSource: data } });
      });
  }

  /**
   * 初始化数组
   * @param length
   */
  initPathArr = (length) => {
    const pathArr = [];
    for (let i = 0; i < length; i += 1) {
      pathArr.push({
        pathIndex: i,
        networkIndex: i,
      });
    }
    this.setState({ pathArr });
  };
  /**
   * 加载环境
   */
  loadEnv = () => {
    const { store } = this.props;
    this.setState({ env: { loading: true, dataSource: [] } });
    store.loadEnv(this.state.projectId)
      .then((data) => {
        this.setState({ env: { loading: false, dataSource: data } });
      });
  };
  /**
   * 提交数据
   * @param e
   */
  handleSubmit =(e) => {
    e.preventDefault();
    const { store, id, type } = this.props;
    const { projectId } = this.state;
    const service = store.getNetwork;
    this.props.form.validateFieldsAndScroll((err, data) => {
      if (!err) {
        const keys = Object.keys(data);
        const postData = { domain: data.domain, name: data.name, envId: data.envId };
        const pathList = [];
        keys.map((k) => {
          if (k.includes('path')) {
            const index = parseInt(k.split('-')[1], 10);
            const value = data[`network-${index}`];
            pathList.push({ path: `/${data[k]}`, serviceId: value });
          }
          return pathList;
        });
        postData.pathList = pathList;
        if (type === 'create') {
          this.setState({ submitting: true });
          store.addData(projectId, postData)
            .then((datasss) => {
              if (datasss) {
                this.handleClose();
              }
              this.setState({ submitting: false });
            }).catch(() => {
              this.setState({ submitting: false });
              Choerodon.prompt(err.response.data.message);
            });
        } else {
          postData.domainId = id;
          this.setState({ submitting: true });
          store.updateData(projectId, id, postData)
            .then((datass) => {
              if (datass) {
                this.handleClose();
              }
              this.setState({ submitting: false });
            }).catch(() => {
              this.setState({ submitting: false });
              Choerodon.prompt(err.response.data.message);
            });
        }
      }
    });
  };

  /**
   * 添加路径
   */
  addPath =() => {
    const pathArr = this.state.pathArr;
    let index = 0;
    if (pathArr.length) {
      index = pathArr[pathArr.length - 1].pathIndex + 1;
      pathArr.push(
        {
          pathIndex: pathArr[pathArr.length - 1].pathIndex + 1,
          networkIndex: pathArr[pathArr.length - 1].pathIndex + 1,
        });
    } else {
      index = 0;
      pathArr.push({
        pathIndex: 0,
        networkIndex: 0,
      });
    }
    this.setState({ pathArr, [index]: { deletedService: this.state[index - 1].deletedService } });
  };
  /**
   * 删除路径
   * @param index 路径数组的索引
   */
  removePath =(index) => {
    const pathArr = this.state.pathArr;
    pathArr.splice(index, 1);
    this.setState({ pathArr, initServiceLen: this.state.initServiceLen - 1 });
  };
  /**
   * 选择环境
   * @param value
   */
  selectEnv = (value) => {
    this.setState({ envId: value });
    const { store } = this.props;
    store.loadNetwork(this.state.projectId, value);
    this.props.form.resetFields();
    this.setState({
      pathArr: [{ pathIndex: 0, networkIndex: 0 }],
      0: { deletedService: [] },
      initServiceLen: 0,
      SingleData: null,
    });
  };

  /**
   * 关闭弹框
   */
  handleClose =() => {
    const { store } = this.props;
    this.setState({ show: false });
    store.setEnv([]);
    store.setNetwork([]);
    this.props.onClose();
  };
  /**
   * 检查名称的唯一性
   * @type {Function}
   */
  checkName =_.debounce((rule, value, callback) => {
    const p = /^([a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*)$/;
    const { SingleData } = this.state;
    if (SingleData && SingleData.name === value) {
      callback();
    } else {
      if (p.test(value)) {
        const { store } = this.props;
        const envId = this.props.form.getFieldValue('envId');
        if (envId) {
          store.checkName(this.state.projectId, value, envId)
            .then((data) => {
              if (data) {
                callback();
              } else {
                callback('名称已存在');
              }
            })
            .catch(() => callback());
        } else {
          callback('请先选环境');
        }
      } else {
        callback('由小写字母、数字、\'-\'或\'.\'组成，并且必须以字母、数字开始和结束');
      }
    }
  }, 1000);

  /**
   * 检查域名和路径组合的唯一性
   * @type {Function}
   */
  checkPath =(rule, value, callback) => {
    const { pathArr } = this.state;
    const domain = this.props.form.getFieldValue('domain');
    const index = parseInt(rule.field.split('-')[1], 10);
    const paths = [];
    for (let i = 0; i < pathArr.length; i += 1) {
      const p = this.props.form.getFieldValue(`path-${pathArr[i].pathIndex}`);
      if (i !== index) {
        paths.push(p);
      }
    }
    if (paths.includes(value)) {
      callback('路径在该域名路径下已存在，请更改路径或者域名路径');
    } else {
      const { store } = this.props;
      if (this.props.type === 'edit' && this.state.initServiceLen > index) {
        const id = this.state.SingleData.id;
        const v = this.state.SingleData.pathList[index].path
          .slice(1, this.state.SingleData.pathList[index].path.length);
        if (v === value && domain === this.state.SingleData.domain) {
          callback();
        } else {
          store.checkPath(this.state.projectId, domain, `/${value}`, id)
            .then((data) => {
              if (data) {
                callback();
              } else {
                callback('路径在该域名路径下已存在，请更改路径或者域名路径');
              }
            })
            .catch((error) => {
              callback();
            });
        }
      } else {
        store.checkPath(this.state.projectId, domain, `/${value}`)
          .then((data) => {
            if (data) {
              callback();
            } else {
              callback('路径在该域名路径下已存在，请更改路径或者域名路径');
            }
          })
          .catch((error) => {
            callback();
          });
      }
    }
  };
  /**
   * 检查域名是否符合规则
   * @type {Function}
   */
  checkDomain =(rule, value, callback) => {
    const { pathArr } = this.state;
    const fields = [];
    pathArr.map((path) => {
      fields.push(`path-${path.pathIndex}`);
      return fields;
    });
    this.props.form.validateFields(fields, { force: true });
    callback();
  };
  /**
   * 校验网络是否可用
   * @param rule
   * @param value
   * @param callback
   */
  checkService = (rule, value, callback) => {
    if (this.props.type === 'create') {
      callback();
    } else {
      const index = parseInt(rule.field.split('-')[1], 10);
      const deletedIns = _.map(this.state[index].deletedService, 'id');
      if (deletedIns.includes(value)) {
        callback('请移除不可用的网络');
      } else {
        callback();
      }
    }
  };

  render() {
    const { store } = this.props;
    const { getFieldDecorator } = this.props.form;
    const menu = AppState.currentMenuType;
    const network = store.getNetwork;
    const { pathArr, SingleData } = this.state;
    const form = this.props.form;
    let addStatus = true;
    // 判断path是否有值
    if (pathArr.length) {
      const hasValue = form.getFieldValue(`path-${pathArr[pathArr.length - 1].pathIndex}`) || (SingleData && SingleData.pathList);
      if (hasValue) {
        addStatus = false;
      }
    }
    const title = this.props.type === 'create' ? <h2 className="c7n-space-first">在项目&quot;{menu.name}&quot;中创建域名</h2> : <h2 className="c7n-space-first">对域名&quot;{SingleData && SingleData.name}&quot;进行修改</h2>;
    const content = this.props.type === 'create' ? '请选择环境，填写域名名称、地址、路径，并选择网络配置域名访问规则' :
      '您可在此修改域名配置信息';
    const contentDom = this.props.visible ? (<div className="c7n-region c7n-domainCreate-wrapper">
      {title}
      <p>
        {content}
        <a href="http://v0-6.choerodon.io/zh/docs/user-guide/deployment-pipeline/ingress/" rel="nofollow me noopener noreferrer" target="_blank" className="c7n-external-link">
          <span className="c7n-external-link-content">
              了解详情
          </span>
          <span className="icon icon-open_in_new" />
        </a>
      </p>
      <Form layout="vertical" onSubmit={this.handleSubmit}>
        <FormItem
          className="c7n-domain-formItem"
          {...formItemLayout}
        >
          {getFieldDecorator('envId', {
            rules: [{
              required: true,
              message: Choerodon.getMessage('该字段是必输的', 'This field is required.'),
              // transform: value => value && value.toString(),
            }],
            initialValue: SingleData ? SingleData.envId : undefined,
          })(
            <Select
              dropdownClassName="c7n-domain-env"
              onFocus={this.loadEnv}
              loading={this.state.env.loading}
              filter
              onSelect={this.selectEnv}
              showSearch
              label="环境名称"
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.props.children[2].toLowerCase().indexOf(input.toLowerCase()) >= 0}
            >
              {this.state.env.dataSource.map(v => (
                <Option value={v.id} key={`${v.id}-env`} disabled={!v.connect}>
                  {!v.connect && <span className="env-status-error" />}
                  {v.connect && <span className="env-status-success" />}
                  {v.name}
                </Option>
              ))}
            </Select>,
          )}
        </FormItem>
        <FormItem
          className="c7n-domain-formItem"
          {...formItemLayout}
        >
          {getFieldDecorator('name', {
            rules: [{
              required: true,
              whitespace: true,
              message: Choerodon.getMessage('该字段是必输的', 'This field is required.'),
            }, {
              validator: this.checkName,
            }],
            initialValue: SingleData ? SingleData.name : '',
          })(
            <Input
              disabled={!(this.props.form.getFieldValue('envId'))}
              maxLength={30}
              label={Choerodon.getMessage('域名名称', 'name')}
              size="default"
            />,
          )}
        </FormItem>
        <FormItem
          className="c7n-domain-formItem"
          {...formItemLayout}
        >
          {getFieldDecorator('domain', {
            rules: [{
              required: true,
              whitespace: true,
              message: Choerodon.getMessage('该字段是必输的', 'This field is required.'),
            }, {
              validator: this.checkDomain,
            }],
            initialValue: SingleData ? SingleData.domain : '',
          })(
            <Input
              disabled={!(this.props.form.getFieldValue('envId'))}
              maxLength={50}
              label={Choerodon.getMessage('域名地址', 'domain')}
              size="default"
            />,
          )}
        </FormItem>
        {pathArr.length >= 1 && pathArr.map((data, index) => (<div key={data.pathIndex}>
          <FormItem
            className="c7n-formItem_180"
            {...formItemLayout}
            key={data.pathIndex}
          >
            {getFieldDecorator(`path-${data.pathIndex}`, {
              rules: [{
                // required: true,
                // message: Choerodon.getMessage('该字段是必输的', 'This field is required.'),
              }, {
                validator: this.checkPath,
              },
              ],
              initialValue: SingleData && this.state.initServiceLen > index
                ? SingleData.pathList[index].path.slice(1, SingleData.pathList[index].path.length) : '',
            })(
              <Input
                prefix={'/'}
                disabled={!(this.props.form.getFieldValue('domain'))}
                maxLength={10}
                label={Choerodon.languageChange('domain.path')}
                size="default"
              />,
            )}
          </FormItem>
          <FormItem
            className="c7n-formItem_312"
            {...formItemLayout}
          >
            {getFieldDecorator(`network-${data.networkIndex}`, {
              rules: [{
                required: true,
                message: Choerodon.getMessage('该字段是必输的', 'This field is required.'),
              }, {
                validator: this.checkService,
              }],
              initialValue: SingleData && this.state.initServiceLen > index
                ? SingleData.pathList[index].serviceId : undefined,
            })(
              <Select
                disabled={!(this.props.form.getFieldValue('envId'))}
                filter
                label={Choerodon.getMessage('网络', 'network')}
                showSearch
                dropdownMatchSelectWidth
                size="default"
                optionFilterProp="children"
                optionLabelProp="children"
                filterOption={
                  (input, option) =>
                    option.props.children[4]
                      .toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
              >
                {this.state[data.pathIndex].deletedService.map(datas => (<Option value={datas.id} key={`${datas.id}-network`}>
                  {datas.status && datas.status === 'running' && <div className={datas.status && datas.status === 'running' && 'c7n-domain-create-status c7n-domain-create-status_running'}>
                    {datas.status && datas.status === 'running' && <div>运行中</div> }
                  </div> }
                  {datas.status && datas.status === 'deleted' && <div className={datas.status && datas.status === 'deleted' && 'c7n-domain-create-status c7n-domain-create-status_deleted'}>
                    {datas.status && datas.status === 'deleted' && <div>已删除</div> }
                  </div> }
                  {datas.status && datas.status === 'failed' && <div className={datas.status && datas.status === 'failed' && 'c7n-domain-create-status c7n-domain-create-status_failed'}>
                    {datas.status && datas.status === 'failed' && <div>失败</div> }
                  </div> }
                  {datas.status && datas.status === 'operating' && <div className={datas.status && datas.status === 'operating' && 'c7n-domain-create-status c7n-domain-create-status_operating'}>
                    {datas.status && datas.status === 'operating' && <div>处理中</div> }
                  </div> }

                  {datas.name}</Option>),
                )}
                {network.map(datas => (<Option value={datas.id} key={`${datas.id}-network`}>
                  <div className={'c7n-domain-create-status c7n-domain-create-status_running'}>
                    <div>运行中</div>
                  </div>
                  {datas.name}</Option>),
                )}
              </Select>,
            )}
          </FormItem>
          { pathArr.length > 1 ? <Button shape="circle" className="c7n-domain-icon-delete" onClick={this.removePath.bind(this, index)}>
            <span className="icon icon-delete" />
          </Button> : <span className="icon icon-delete c7n-app-icon-disabled" />}
        </div>))}
        <div className="c7n-domain-btn-wrapper">
          <Tooltip title={addStatus ? '请先填写路径' : ''}>
            <Button className="c7n-domain-btn" onClick={this.addPath} type="primary" disabled={addStatus} icon="add">添加路径</Button>
          </Tooltip>
        </div>
      </Form>
    </div>) : null;
    return (
      <Sidebar
        okText={this.props.type === 'create' ? '创建' : '保存'}
        cancelText="取消"
        visible={this.props.visible}
        title={this.props.title}
        onCancel={this.handleClose}
        onOk={this.handleSubmit}
        className="c7n-podLog-content"
        confirmLoading={this.state.submitting}
      >
        {this.props.visible ? contentDom : null}
      </Sidebar>
    );
  }
}

export default Form.create({})(withRouter(CreateDomain));
