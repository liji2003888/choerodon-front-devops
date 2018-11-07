import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';
import { Tooltip, Icon } from 'choerodon-ui';
import "./index.scss";

function UploadIcon (props) {
  const { text, status, prevText, intl: { formatMessage } } = props;
  let dom = text;
  switch (status) {
    case 'upload':
      dom = (<Fragment>
        <span className="c7n-instance-upload-text">{text || formatMessage({ id: 'ist.deploy.upload' })}</span>
        <Tooltip title={formatMessage({ id: `ist.version.${text ? 'upload' : 'deploy'}` }, { text: prevText })}>
          <div className="c7n-instance-upload">
            <svg width="16" height="14">
              <path className="c7n-instance-upload-arrow" d="
              M 5  11
              L 11 11
              L 11 6.5
              L 15 6.5
              L 8  1
              L 1  6.5
              L 5  6.5
              Z
            "/>
              <line  className="c7n-instance-upload-line1" x1="3" y1="10" x2="13" y2="10" />
              <line  className="c7n-instance-upload-line2" x1="3" y1="12.5" x2="13" y2="12.5" />
            </svg>
          </div>
        </Tooltip>
      </Fragment>)
      break;
    case 'failed':
      dom = (<Fragment>
        <span className="c7n-instance-upload-text">{text ||  formatMessage({ id: 'ist.deploy.failed' })}</span>
        <Tooltip title={formatMessage({ id: `ist.version.${text || 'deploy.'}failed` }, { text: prevText })}>
          <Icon type="error" className="c7n-instance-upload-failed" />
        </Tooltip>
      </Fragment>);
      break;
    default:
      dom = <span className="c7n-instance-upload-text">{text}</span>;
  }
  return(dom);
}

UploadIcon.defaultProps = {
  status: 'text',
  prevText: '',
};

UploadIcon.propTypes = {
  status: PropTypes.string,
  prevText: PropTypes.string,
  text: PropTypes.string,
};

export default injectIntl(UploadIcon);