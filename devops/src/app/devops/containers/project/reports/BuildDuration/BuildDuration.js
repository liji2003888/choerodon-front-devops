import React, { Component } from 'react';
import { observer } from 'mobx-react';
import { injectIntl, FormattedMessage } from 'react-intl';
import { Page, Header, Content, stores } from 'choerodon-front-boot';
import { Select, Button, Tooltip, Spin } from 'choerodon-ui';
import ReactEcharts from 'echarts-for-react';
import _ from 'lodash';
import moment from 'moment';
import ChartSwitch from '../Component/ChartSwitch';
import './BuildDuration.scss';
import TimePicker from '../Component/TimePicker';
import NoChart from '../Component/NoChart';
import BuildTable from '../BuildTable/BuildTable';


const { AppState } = stores;
const { Option } = Select;
const HEIGHT = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

@observer
class BuildDuration extends Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }

  componentDidMount() {
    this.loadDatas();
  }

  componentWillUnmount() {
    const { ReportsStore } = this.props;
    ReportsStore.setAllData([]);
    ReportsStore.setBuildDuration({});
    ReportsStore.setStartTime(moment().subtract(6, 'days'));
    ReportsStore.setEndTime(moment());
    ReportsStore.setAppId(null);
    ReportsStore.setPageInfo({ number: 0, totalElements: 0, size: HEIGHT <= 900 ? 10 : 15 });
  }

  /**
   * 加载数据
   */
  loadDatas = () => {
    const { ReportsStore } = this.props;
    const { id } = AppState.currentMenuType;
    ReportsStore.loadApps(id).then((data) => {
      if (data && data.length) {
        ReportsStore.setAppId(data[0].id);
        this.loadCharts();
      }
    });
  };

  /**
   * 刷新
   */
  handleRefresh = () => {
    const { ReportsStore } = this.props;
    const { id } = AppState.currentMenuType;
    const { pageInfo } = ReportsStore;
    ReportsStore.loadApps(id);
    this.loadCharts(pageInfo);
  };

  /**
   * 选择应用
   * @param value
   */
  handleAppSelect = (value) => {
    const { ReportsStore } = this.props;
    ReportsStore.setAppId(value);
    this.loadCharts();
  };

  /**
   * 图表函数
   */
  getOption() {
    const { intl: { formatMessage }, ReportsStore } = this.props;
    const { pipelineTime, refs, versions, createDates } = ReportsStore.getBuildDuration;
    const averageDuration = [];
    let sum = 0;
    _.map(pipelineTime, (value, index) => {
      sum += parseFloat(value);
      averageDuration[index] = sum / (index + 1);
    });
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
        backgroundColor: '#fff',
        textStyle: {
          color: '#000',
          fontSize: 13,
          lineHeight: 20,
        },
        padding: [10, 15],
        extraCssText:
          'box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.2); border: 1px solid #ddd; border-radius: 0;',
        formatter(params, ticket) {
          const version = versions[params[0].dataIndex] ? `${versions[params[0].dataIndex]}` : `${formatMessage({ id: 'report.build-duration.noversion' })}`;
          let time = params[0].value;
          if (time.split('.')[1] === '00') {
            time = `${time.toString().split('.')[0]}${formatMessage({ id: 'minutes' })}`;
          } else if (time.split('.')[0] === '0') {
            time = `${(Number(time.toString().split('.')[1]) * 0.6).toFixed()}${formatMessage({ id: 'seconds' })}`;
          } else if (time.split('.').length === 2) {
            time = `${time.toString().split('.')[0]}${formatMessage({ id: 'minutes' })}${(Number(time.toString().split('.')[1]) * 0.6).toFixed()}${formatMessage({ id: 'seconds' })}`;
          } else {
            time = null;
          }
          return `<div>
            <div>${formatMessage({ id: 'ist.time' })}：${createDates[params[0].dataIndex]}</div>
            <div>${formatMessage({ id: 'network.column.version' })}：${version}</div>
            <div>${formatMessage({ id: 'report.build-duration.duration' })}：${time}</div>
          </div>`;
        },
      },
      grid: {
        left: '2%',
        right: '3%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        axisTick: { show: false },
        axisLine: {
          lineStyle: {
            color: '#eee',
            type: 'solid',
            width: 2,
          },
        },
        axisLabel: {
          margin: 13,
          textStyle: {
            color: 'rgba(0, 0, 0, 0.65)',
            fontSize: 12,
          },
          rotate: 40,
          formatter(value) {
            return `${value.substr(0, value.indexOf('-') + 5)}`;
          },
        },
        splitLine: {
          lineStyle: {
            color: ['#eee'],
            width: 1,
            type: 'solid',
          },
        },
        data: refs,
      },
      yAxis: {
        name: `${formatMessage({ id: 'minTime' })}`,
        type: 'value',

        nameTextStyle: {
          fontSize: 13,
          color: '#000',
          padding: [0, 0, 0, 22],
        },
        axisTick: { show: false },
        axisLine: {
          lineStyle: {
            color: '#eee',
            type: 'solid',
            width: 2,
          },
        },

        axisLabel: {
          margin: 19.3,
          textStyle: {
            color: 'rgba(0, 0, 0, 0.65)',
            fontSize: 12,
          },
        },
        splitLine: {
          lineStyle: {
            color: '#eee',
            type: 'solid',
            width: 1,
          },
        },
      },
      series: [
        {
          type: 'bar',
          barWidth: '30%',
          itemStyle: {
            color: 'rgba(77, 144, 254, 0.60)',
            borderColor: '#4D90FE',
          },
          data: pipelineTime,
        },
        {
          type: 'line',
          symbol: 'none',
          lineStyle: {
            color: 'rgba(0, 0, 0, 0.36)',
            width: 2,
            type: 'dashed',
            border: '1px solid #4D90FE',
          },
          data: averageDuration,
        },
      ],
    };
  }

  loadCharts = (pageInfo) => {
    const { ReportsStore } = this.props;
    const projectId = AppState.currentMenuType.id;
    const appId = ReportsStore.getAppId;
    const startTime = ReportsStore.getStartTime.format().split('T')[0].replace(/-/g, '/');
    const endTime = ReportsStore.getEndTime.format().split('T')[0].replace(/-/g, '/');
    ReportsStore.loadBuildDuration(projectId, appId, startTime, endTime);
    if (pageInfo) {
      ReportsStore.loadBuildTable(projectId, appId, startTime, endTime, pageInfo.current - 1, pageInfo.pageSize);
    } else {
      ReportsStore.loadBuildTable(projectId, appId, startTime, endTime);
    }
  };

  render() {
    const { intl: { formatMessage }, history, ReportsStore } = this.props;
    const { id, name, type, organizationId } = AppState.currentMenuType;
    const { apps, appId, echartsLoading, loading, pageInfo, allData } = ReportsStore;
    return (<Page className="c7n-region c7n-ciPipeline">
      <Header
        title={formatMessage({ id: 'report.build-duration.head' })}
        backPath={`/devops/reports?type=${type}&id=${id}&name=${name}&organizationId=${organizationId}`}
      >
        <ChartSwitch
          history={history}
          current="buildDuration"
        />
        <Button
          icon="refresh"
          onClick={this.handleRefresh}
        >
          <FormattedMessage id="refresh" />
        </Button>
      </Header>
      <Content code="report.build-duration" value={{ name }} className="c7n-buildDuration-content">
        {appId ? <React.Fragment>
          <div className="c7n-buildDuration-select">
            <Select
              label={formatMessage({ id: 'chooseApp' })}
              className="c7n-app-select_247"
              defaultValue={appId}
              value={appId}
              optionFilterProp="children"
              filterOption={(input, option) => option.props.children.props.children.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
              filter
              onChange={this.handleAppSelect}
            >
              {
                _.map(apps, (app, index) => (
                  <Option value={app.id} key={index}>
                    <Tooltip title={app.code}>
                      <span className="c7n-app-select-tooltip">
                        {app.name}
                      </span>
                    </Tooltip>
                  </Option>))
              }
            </Select>
            <TimePicker startTime={ReportsStore.getStartTime} endTime={ReportsStore.getEndTime} func={this.loadCharts} store={ReportsStore} />
          </div>
          <Spin spinning={echartsLoading}>
            <ReactEcharts className="c7n-buildDuration-echarts" option={this.getOption()} />
          </Spin>
          <BuildTable loading={loading} dataSource={allData} pagination={pageInfo} loadDatas={this.loadDatas} />
        </React.Fragment> : <NoChart title={formatMessage({ id: 'report.no-app' })} des={formatMessage({ id: 'report.no-app-des' })} />}
      </Content>
    </Page>);
  }
}

export default injectIntl(BuildDuration);
