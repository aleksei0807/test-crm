/* @flow */
import React, { Component, PropTypes } from 'react';
import CSSModules from 'react-css-modules';
import { fromEvents, stream } from 'kefir';
/* eslint-disable no-duplicate-imports */
import type { Element } from 'react';
import type { Emitter } from 'kefir';
/* eslint-enable no-duplicate-imports */
import { Scrollbars } from 'react-custom-scrollbars';
import { connect } from 'react-redux';
import Preloader from 'halogen/BeatLoader';
import { primary1Color } from '../../styles/vars';
import { init, getUsers, setScrollPos, changeUser } from '../../actions/users';
import UserList from '../../components/UserList';
import styles from './index.css';

const mapStateToProps = state => ({
	userCount: state.users.userCount,
	initScrollPos: state.users.initScrollPos,
	firstDataID: state.users.firstDataID,
	pendingLoading: state.users.pendingLoading,
});

@connect(mapStateToProps, { init, getUsers, changeUser })
@CSSModules(styles)
export default class ScrollArea extends Component {
	/* eslint-disable react/sort-comp */
	viewportHeight: number;
	renderingPagesCount: number;
	rowHeight: number;
	tableHeaderHeight: number;
	thumb: ?HTMLElement;
	state: {
		rowsPerPage: number;
		firstRenderedRowID: number;
		verticalScrollPos: number;
		thumbPosition: number;
		pendingScroll: boolean;
		forceScroll: boolean | number;
	};
	scrollbar: ?Object;
	ignoreScrollPos: number | false;
	lastScrollPos: number;
	scrollEmitter: ?Emitter<*, *>;
	dragEmitter: ?Emitter<*, *>;
	thumbPositionerEmitter: ?Emitter<*, *>;
	scrollPositionSaverEmitter: ?Emitter<*, *>;
	currentElementID: number;


	static propTypes = {
		headerColumns: PropTypes.arrayOf(PropTypes.string).isRequired,
		stylesHeaderColumns: PropTypes.array,
		rowChilds: PropTypes.arrayOf(
			PropTypes.oneOfType([
				PropTypes.string,
				PropTypes.element,
			])
		),
		rows: PropTypes.oneOfType([
			PropTypes.arrayOf(
				PropTypes.arrayOf(
					PropTypes.oneOfType([
						PropTypes.string,
						PropTypes.element,
					])
				)
			),
			PropTypes.object,
		]),
		marginTop: PropTypes.number,
	};

	constructor(...args: Array<*>) {
		super(...args);
		this.state = {
			firstRenderedRowID: 0,
			rowsPerPage: 0,
			verticalScrollPos: 0,
			forceScroll: false,
			thumbPosition: 0,
			pendingScroll: false,
		};
		this.viewportHeight = 0;
		this.lastScrollPos = 0;
		this.renderingPagesCount = 11; // Harry Potter and Magic Numbers
		this.tableHeaderHeight = 61;
		this.rowHeight = 100;
		this.scrollbar = null;
		this.ignoreScrollPos = false;
		this.scrollEmitter = null;
		this.dragEmitter = null;
		this.currentElementID = 0;
		this.thumb = null;
		this.thumbPositionerEmitter = null;
		this.scrollPositionSaverEmitter = null;
	}
	/* eslint-enable react/sort-comp */

	componentDidMount() {
		this.getRowsPerPage();
	}

	componentWillReceiveProps(nextProps: Object) {
		if (this.props.userCount !== nextProps.userCount) {
			this.scrollToAbsPos(0);
		}
		if (this.props.initScrollPos !== nextProps.initScrollPos && nextProps.initScrollPos !== null) {
			this.scrollToAbsPos(nextProps.initScrollPos);
		}
	}
	
	componentDidUpdate(prevProps: Object, prevState: Object): void {
		if (prevState.rowsPerPage === 0 && this.state.rowsPerPage !== 0) {
			this.props.init();
			fromEvents(window, 'resize')
			.debounce(300)
			.onValue(() => {
				if (this.getViewportHeight() !== this.viewportHeight) {
					this.getRowsPerPage();
				}
			});

			stream((emitter: Emitter<*, *>) => {
				this.scrollEmitter = emitter;
			})
			.onValue(this.scroll);

			stream((emitter: Emitter<*, *>) => {
				this.dragEmitter = emitter;
			})
			.debounce(40)
			.onValue(this.drag);

			stream((emitter: Emitter<*, *>) => {
				this.thumbPositionerEmitter = emitter;
			})
			.debounce(16)
			.onValue(this.updateThumbPos);

			stream((emitter: Emitter<*, *>) => {
				this.scrollPositionSaverEmitter = emitter;
			})
			.debounce(100)
			.onValue(({id, scrollTop}: { id: number; scrollTop: number; }) => {
				if (this.props.initScrollPos !== null) {
					const absPos = this.rowHeight * id + scrollTop;
					setScrollPos(absPos);
				}
			});
		} else if (prevState.rowsPerPage !== this.state.rowsPerPage
			|| this.state.forceScroll !== false) {
			this.forceScroll(this.state.forceScroll);
		}
		if (this.state.pendingScroll
		&& prevState.firstRenderedRowID !== this.state.firstRenderedRowID) {
			this.scrollDone();
		}
	}

	scrollDone = () => {
		this.setState({
			pendingScroll: false,
		});
	}

	getViewportHeight(): number {
		let documentHeight = 0;
		if (document.documentElement) {
			documentHeight = document.documentElement.clientHeight;
		}
		return Math.max(documentHeight, window.innerHeight || 0);
	}

	getRowsPerPage = () => {
		this.viewportHeight = this.getViewportHeight() - this.tableHeaderHeight;
		const rowsPerPage = Math.ceil(this.viewportHeight / this.rowHeight);
		let firstRenderedRowID = this.currentElementID - (rowsPerPage * 2);
		firstRenderedRowID = Math.max(firstRenderedRowID, 0);
		if (this.props.userCount) {
			firstRenderedRowID = Math.min(firstRenderedRowID,
			this.props.userCount - 1 - this.renderingPagesCount * rowsPerPage);
		}
		if (this.state.rowsPerPage !== rowsPerPage) {
			this.setState({
				rowsPerPage,
				firstRenderedRowID,
			});
		}
	}

	getPaddings = (): {top: number; bottom: number} => {
		const top = this.tableHeaderHeight + (this.state.firstRenderedRowID * this.rowHeight);
		const bottom = top + (this.state.rowsPerPage * this.renderingPagesCount * this.rowHeight);
		return {
			top,
			bottom,
		};
	}

	getScrollTop = (): number => {
		if (this.scrollbar) {
			return this.scrollbar.getScrollTop();
		}
		return 0;
	}

	scroll = (v: UIEvent): void => {
		const triggerPageNum = 2; // Harry Potter and Secret Number
		const pageHeight = this.state.rowsPerPage * this.rowHeight;
		const triggerOffset = pageHeight * triggerPageNum;
		const absPageY = (this.getScrollTop()
			+ (this.state.firstRenderedRowID * this.rowHeight));
		const pageElemCount = this.state.rowsPerPage;

		if (this.props.userCount <= this.state.rowsPerPage * this.renderingPagesCount) {
			this.lastScrollPos = this.getScrollTop();
			return;
		}

		if (!this.forceScroll || this.ignoreScrollPos !== false) {
			this.lastScrollPos = this.getScrollTop();
			if (this.forceScroll
				|| (v.target instanceof HTMLDivElement && this.ignoreScrollPos === v.target.scrollTop)) {
				this.ignoreScrollPos = false;
			}
			this.lastScrollPos = this.getScrollTop();
			return;
		}

		this.currentElementID = Math.floor(absPageY / this.rowHeight);

		if (absPageY < (this.tableHeaderHeight + triggerOffset)) {
			if (this.state.firstRenderedRowID !== 0) {
				const scrollTargetPos = (this.getScrollTop()
					- (pageElemCount * this.rowHeight * (triggerPageNum + 1)));
				this.ignoreScrollPos = scrollTargetPos;
				if (this.scrollbar) {
					this.scrollbar.scrollTop(scrollTargetPos);
				}
				this.setState({
					firstRenderedRowID: 0,
				});
			}
			this.lastScrollPos = this.getScrollTop();
			return;
		}

		const totalRowsHeight = this.props.userCount * this.rowHeight;
		if (absPageY > (this.tableHeaderHeight + (totalRowsHeight - triggerOffset))) {
			const rowsPerRender = this.state.rowsPerPage * this.renderingPagesCount;
			const firstRenderedRowID = this.props.userCount - rowsPerRender;
			if (this.state.firstRenderedRowID !== firstRenderedRowID) {
				this.setState({
					firstRenderedRowID,
				});
			}
			this.lastScrollPos = absPageY;
			return;
		}

		const { top, bottom } = this.getPaddings();

		const relPageY = this.getScrollTop();
		if (relPageY > triggerOffset
			&& relPageY < (
				this.renderingPagesCount
				* this.state.rowsPerPage
				* this.rowHeight
				- triggerOffset)
			) {
			this.lastScrollPos = this.getScrollTop();
			return;
		}

		if (this.state.pendingScroll) {
			this.lastScrollPos = this.getScrollTop();
			return;
		}

		const scrollTriggered = (absPageY < (top + triggerOffset)
			|| absPageY > (bottom - triggerOffset));
		if (scrollTriggered) {
			let idOffset = this.state.rowsPerPage;
			let nextScrollPos = this.getScrollTop();
			const scrollUp = this.getScrollTop() < this.lastScrollPos;
			const scrollOffset = (this.renderingPagesCount - triggerPageNum * 2) * pageHeight;
			if (scrollUp) {
				idOffset *= this.renderingPagesCount - triggerPageNum;
				nextScrollPos += scrollOffset;
			} else {
				nextScrollPos -= scrollOffset;
				idOffset *= triggerPageNum;
			}
			const firstRenderedRowID = Math.max(this.currentElementID - idOffset, 0);
			if (firstRenderedRowID === this.state.firstRenderedRowID) {
				this.lastScrollPos = this.getScrollTop();
				return;
			}
			if (this.scrollbar) {
				this.scrollbar.scrollTop(nextScrollPos);
			}
			this.setState({
				pendingScroll: true,
				firstRenderedRowID,
			});
		}
		this.lastScrollPos = this.getScrollTop();
	}

	forceScroll = (offset: boolean | number): void => {
		if (this.scrollbar) {
			const s = this.scrollbar;
			let scrollOffset;
			const twoPages = this.state.rowsPerPage * 2;
			if (typeof offset === 'number') {
				scrollOffset = offset;
				scrollOffset = Math.max(scrollOffset, 0);
			} else {
				scrollOffset = twoPages * this.rowHeight;
				scrollOffset = Math.max(scrollOffset, 0);
				scrollOffset = Math.min(scrollOffset,
				this.state.rowsPerPage * (this.renderingPagesCount - 1) * this.rowHeight);
			}
			if (typeof offset !== 'number') {
				if (this.state.firstRenderedRowID <= twoPages
				|| this.state.firstRenderedRowID >= this.props.userCount - twoPages) {
					scrollOffset = this.state.firstRenderedRowID * this.rowHeight;
				}
			}

			s.scrollTop(scrollOffset);
			if (this.state.forceScroll !== false) {
				this.setState({
					forceScroll: false,
				});
			}
			this.lastScrollPos = this.getScrollTop();
		}
	}

	handleScroll = (v: UIEvent) => {
		if (this.scrollEmitter) {
			this.scrollEmitter.emit(v);
		}
	}

	buildVerticalTrack(props: Object): Element<any> {
		return <div {...props} className={styles['track-vertical']} />;
	}

	buildVerticalThumb = (props: Object): Element<any> => (
		<div
			{...props}
			id="thumb"
			style={{...props.style, transform: `translateY(${this.state.thumbPosition}px)`}}
			className={styles['thumb-vertical']}
			/>
	)

	scrollToAbsPos = (absPos: number) => {
		if (this.scrollbar && absPos === 0
			|| isNaN(absPos)
			|| absPos === Infinity
			|| absPos === -Infinity
		) {
			this.setState({
				firstRenderedRowID: 0,
				forceScroll: 0,
			});
			this.lastScrollPos = this.getScrollTop();
			return;
		}
		if (absPos <= this.state.rowsPerPage * this.rowHeight * 3) {
			this.setState({
				firstRenderedRowID: 0,
				forceScroll: absPos,
			});
			this.lastScrollPos = this.getScrollTop();
			return;
		}
		const pages = (
			this.props.userCount
			- this.state.rowsPerPage
			* (this.renderingPagesCount - 3)
		);
		if (absPos >= pages * this.rowHeight) {
			const firstRenderedRowID = (
				this.props.userCount
				- this.state.rowsPerPage
				* this.renderingPagesCount
			);
			this.setState({
				firstRenderedRowID,
				forceScroll: absPos - firstRenderedRowID * this.rowHeight,
			});
			this.lastScrollPos = this.getScrollTop();
			return;
		}
		const absToPageHeight = absPos / this.rowHeight;
		const realPageCount = absToPageHeight / this.state.rowsPerPage;
		let pageCount = Math.floor(realPageCount);
		if (realPageCount > 2) {
			pageCount -= 2;
		}
		let relativeTarget = absPos - pageCount * this.rowHeight * this.state.rowsPerPage;
		if (realPageCount >= Math.floor(this.props.userCount / this.state.rowsPerPage)) {
			relativeTarget += this.rowHeight * this.state.rowsPerPage * 2;
		}

		let targetFirstRenderID = pageCount * this.state.rowsPerPage;
		targetFirstRenderID = Math.max(targetFirstRenderID, 0);
		const renderingRowsCount = this.state.rowsPerPage * this.renderingPagesCount;
		const maxTargetFirstRenderID = this.props.userCount - renderingRowsCount;
		if (targetFirstRenderID > maxTargetFirstRenderID) {
			relativeTarget += this.rowHeight * this.state.rowsPerPage * (this.renderingPagesCount - 2);
			targetFirstRenderID = maxTargetFirstRenderID;
		}
		targetFirstRenderID -= this.state.rowsPerPage;
		relativeTarget += this.state.rowsPerPage * this.rowHeight;
		this.setState({
			firstRenderedRowID: targetFirstRenderID,
			forceScroll: relativeTarget,
		});
		this.lastScrollPos = this.getScrollTop();
	}

	handleScrollUpdate = (v: {
		thumbHeight: number; clientY: number; trackVerticalHeight: number; scrollTop: number;
	}) => {
		if (this.scrollPositionSaverEmitter) {
			this.scrollPositionSaverEmitter
			.emit({
				id: this.state.firstRenderedRowID,
				scrollTop: v.scrollTop,
			});
		}
		if (v.thumbHeight !== null) {
			if (this.props.userCount <= this.state.rowsPerPage * this.renderingPagesCount) {
				return;
			}
			const requestedRowID = Math.floor(v.clientY / v.trackVerticalHeight * this.props.userCount);
			const firstRenderedRowID = requestedRowID - this.state.rowsPerPage * 2;
			const thumbHeightOffset = v.thumbHeight / v.trackVerticalHeight * v.clientY;
			const thumbPosition = v.thumbHeight - thumbHeightOffset + v.clientY;
			this.setState({
				firstRenderedRowID,
				forceScroll: true,
			});
			this.setThumbPos(thumbPosition);
		}
	}

	setThumbPos = (thumbPosition: number): void => {
		const thumb = document.getElementById('thumb');
		if (thumb) {
			thumb.style.transform = `translateY(${thumbPosition}px)`;
		}
	}

	scrollTopMod = (scrollTop: number): number => (
		scrollTop + this.state.firstRenderedRowID * this.rowHeight
	)

	drag = (requestedPosition: number) => {
		const requestedID = Math.floor(requestedPosition / this.rowHeight);
		let firstRenderedRowID = requestedID - (this.state.rowsPerPage * 2);
		firstRenderedRowID = Math.max(firstRenderedRowID, 0);
		firstRenderedRowID = Math.min(firstRenderedRowID,
			this.props.userCount - 1 - this.renderingPagesCount * this.state.rowsPerPage);
		this.setState({
			firstRenderedRowID,
			forceScroll: true,
		});
	}

	handleDrag = (view: HTMLElement, event: MouseEvent) => {
		if (this.thumbPositionerEmitter) {
			this.thumbPositionerEmitter.emit({view, event});
		}
	}

	updateThumbPos = ({view, event}: {view: HTMLElement; event: MouseEvent}): void => {
		const viewportHeight = this.getViewportHeight();
		let evY = event.clientY;
		if (evY <= 0) {
			if (this.dragEmitter) {
				this.dragEmitter.emit(0);
			}
			this.setThumbPos(0);
			return;
		}
		evY = Math.max(evY, 0);
		evY = Math.min(evY, viewportHeight);
		const relativeHeightTop = this.state.firstRenderedRowID * this.rowHeight;
		const relativeHeightBottom = relativeHeightTop + view.scrollHeight;
		const requestedPosition = evY / viewportHeight * this.props.userCount * this.rowHeight;

		let thumbHeight = 0;
		const thumb = document.getElementById('thumb');
		if (thumb) {
			thumbHeight = thumb.clientHeight;
		}

		const thumbHeightOffset = thumbHeight / viewportHeight * evY;

		const thumbPosition = evY - thumbHeightOffset;

		this.setThumbPos(thumbPosition);

		if (requestedPosition < relativeHeightBottom && requestedPosition > relativeHeightTop) {
			if (this.scrollbar) {
				this.scrollbar.scrollTop(requestedPosition - relativeHeightTop);
			}
			return;
		}

		if (this.dragEmitter) {
			this.dragEmitter.emit(requestedPosition);
		}
	}

	render(): Element<any> {
		const {
			headerColumns,
			stylesHeaderColumns,
			stylesRowColumns,
			selectable,
			marginTop,
			rows,
			pendingLoading,
			initScrollPos,
			userCount,
		} = this.props;

		const rowHeight = this.rowHeight || 100;

		const { firstRenderedRowID: firstRowID = 0, rowsPerPage } = this.state;

		return (
			<Scrollbars
				ref={(ref: HTMLElement) => { this.scrollbar = ref; }}
				onScroll={this.handleScroll}
				renderTrackVertical={(props: Object) => this.buildVerticalTrack(props)}
				renderThumbVertical={(props: Object) => this.buildVerticalThumb(props)}
				scrollHeight={this.props.userCount * this.rowHeight}
				onUpdate={this.handleScrollUpdate}
				disableAutoScrollOnTrack
				scrollTopMod={this.scrollTopMod}
				handleDrag={this.handleDrag}
				style={{
					height: `calc(100% - ${this.tableHeaderHeight}px)`,
				}}>
				{initScrollPos === null ? (
					<div
						style={{
							width: '100%',
							height: '100%',
							display: 'flex',
							justifyContent: 'center',
							alignItems: 'center',
						}}>
						<Preloader color={primary1Color} />
					</div>
				) : (
					<div>
						{userCount === 0 ? null : (
							<UserList
								headerColumns={headerColumns}
								stylesHeaderColumns={stylesHeaderColumns}
								stylesRowColumns={stylesRowColumns}
								selectable={selectable}
								marginTop={marginTop}
								rows={rows}
								rowHeight={rowHeight}
								firstRowID={firstRowID}
								rowsPerPage={rowsPerPage}
								firstDataID={this.props.firstDataID}
								rowsCount={this.props.userCount}
								renderingPagesCount={this.renderingPagesCount}
								getUsers={this.props.getUsers}
								maxRows={this.props.userCount < this.state.rowsPerPage
									? this.props.userCount : null}
								changeUser={this.props.changeUser}
								pendingLoading={pendingLoading}
								/>
						)}
					</div>
				)}
			</Scrollbars>
		);
	}
}
