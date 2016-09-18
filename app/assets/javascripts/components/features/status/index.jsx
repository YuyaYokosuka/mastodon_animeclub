import { connect }              from 'react-redux';
import PureRenderMixin          from 'react-addons-pure-render-mixin';
import ImmutablePropTypes       from 'react-immutable-proptypes';
import { fetchStatus }          from '../../actions/statuses';
import Immutable                from 'immutable';
import EmbeddedStatus           from '../../components/status';
import { favourite, reblog }    from '../../actions/interactions';
import { replyCompose }         from '../../actions/compose';

function selectStatus(state, id) {
  let status = state.getIn(['timelines', 'statuses', id]);

  status = status.set('account', state.getIn(['timelines', 'accounts', status.get('account')]));

  if (status.get('reblog') !== null) {
    status = status.set('reblog', selectStatus(state, status.get('reblog')));
  }

  return status;
};

function selectStatuses(state, ids) {
  return ids.map(id => selectStatus(state, id));
};

const mapStateToProps = (state, props) => ({
  status: selectStatus(state, Number(props.params.statusId)),
  ancestors: selectStatuses(state, state.getIn(['timelines', 'ancestors', Number(props.params.statusId)], Immutable.OrderedSet())),
  descendants: selectStatuses(state, state.getIn(['timelines', 'descendants', Number(props.params.statusId)], Immutable.OrderedSet()))
});

const Status = React.createClass({

  propTypes: {
    params: React.PropTypes.object.isRequired,
    dispatch: React.PropTypes.func.isRequired,
    status: ImmutablePropTypes.map,
    ancestors: ImmutablePropTypes.orderedSet.isRequired,
    descendants: ImmutablePropTypes.orderedSet.isRequired
  },

  mixins: [PureRenderMixin],

  componentWillMount () {
    this.props.dispatch(fetchStatus(this.props.params.statusId));
  },

  componentWillReceiveProps (nextProps) {
    if (nextProps.params.statusId !== this.props.params.statusId && nextProps.params.statusId) {
      this.props.dispatch(fetchStatus(nextProps.params.statusId));
    }
  },

  handleFavouriteClick (status) {
    this.props.dispatch(favourite(status));
  },

  handleReplyClick (status) {
    this.props.dispatch(replyCompose(status));
  },

  handleReblogClick (status) {
    this.props.dispatch(reblog(status));
  },

  renderChildren (list) {
    return list.map(s => <EmbeddedStatus status={s} key={s.get('id')} onReply={this.handleReplyClick} onFavourite={this.handleFavouriteClick} onReblog={this.handleReblogClick} />);
  },

  render () {
    const { status, ancestors, descendants } = this.props;

    if (status === null) {
      return <div>Loading {this.props.params.statusId}...</div>;
    }

    const account = status.get('account');

    return (
      <div style={{ overflowY: 'scroll', flex: '1 1 auto' }} className='scrollable'>
        <div>{this.renderChildren(ancestors)}</div>

        <EmbeddedStatus status={status} onReply={this.handleReplyClick} onFavourite={this.handleFavouriteClick} onReblog={this.handleReblogClick} />

        <div>{this.renderChildren(descendants)}</div>
      </div>
    );
  }

});

export default connect(mapStateToProps)(Status);