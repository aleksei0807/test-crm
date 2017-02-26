/* @flow */
import React, { Component, PropTypes } from 'react';
import CSSModules from 'react-css-modules';
import { fromEvents, stream } from 'kefir';
/* eslint-disable no-duplicate-imports */
import type { Element } from 'react';
import type { Emitter } from 'kefir';
/* eslint-enable no-duplicate-imports */
import { Scrollbars } from 'react-custom-scrollbars';
import UserList from '../../components/UserList';
import styles from './index.css';

@CSSModules(styles)
export default class ScrollArea extends Component {
	/* eslint-disable react/sort-comp */
	viewportHeight: number;
	renderingPagesCount: number;
	rowHeight: number;
	tableHeaderHeight: number;
	rowsCount: number;
	thumb: ?HTMLElement;
	state: {
		rowsPerPage: number;
		firstRenderedRowID: number;
		verticalScrollPos: number;
		thumbPosition: number;
		forceScroll: boolean;
	};
	scrollbar: ?Object;
	ignoreScrollPos: number | false;
	lastScrollPos: number;
	scrollEmitter: ?Emitter<*, *>;
	dragEmitter: ?Emitter<*, *>;
	thumbPositionerEmitter: ?Emitter<*, *>;
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
		rows: PropTypes.arrayOf(
			PropTypes.arrayOf(
				PropTypes.oneOfType([
					PropTypes.string,
					PropTypes.element,
				])
			)
		),
		marginTop: PropTypes.number,
	};

	constructor(...args: Array<*>) {
		super(...args);
		this.state = {
			firstRenderedRowID: 0,
			rowsPerPage: 10,
			verticalScrollPos: 0,
			forceScroll: false,
			thumbPosition: 0,
		};
		this.viewportHeight = 0;
		this.lastScrollPos = 0;
		this.renderingPagesCount = 11; // Harry Potter and magic numbers
		this.tableHeaderHeight = 61;
		this.rowHeight = 100;
		this.rowsCount = 10e5;
		this.scrollbar = null;
		this.ignoreScrollPos = false;
		this.scrollEmitter = null;
		this.dragEmitter = null;
		this.currentElementID = 0;
		this.thumb = null;
		this.thumbPositionerEmitter = null;
	}
	/* eslint-enable react/sort-comp */

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
		firstRenderedRowID = Math.min(firstRenderedRowID,
		this.rowsCount - 1 - this.renderingPagesCount * rowsPerPage);
		if (this.state.rowsPerPage !== rowsPerPage) {
			this.setState({
				rowsPerPage,
				firstRenderedRowID,
			});
		}
	}

	componentWillMount() {
		this.getRowsPerPage();
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
		const triggerPageNum = 2;
		const triggerOffset = this.viewportHeight * triggerPageNum;
		const absPageY = this.getScrollTop()
			+ (this.state.firstRenderedRowID * this.rowHeight);
		const pageHeight = this.viewportHeight;
		const pageElemCount = this.state.rowsPerPage;


		if (!this.forceScroll || this.ignoreScrollPos !== false) {
			this.lastScrollPos = this.getScrollTop();
			if (this.forceScroll
				|| (v.target instanceof HTMLDivElement && this.ignoreScrollPos === v.target.scrollTop)) {
				this.ignoreScrollPos = false;
			}
			return;
		}

		this.currentElementID = Math.floor((absPageY - this.tableHeaderHeight) / this.rowHeight);

		if (absPageY < (this.tableHeaderHeight + triggerOffset)) {
			if (this.state.firstRenderedRowID !== 0) {
				const scrollTargetPos = this.getScrollTop()
				- (pageElemCount * this.rowHeight * (triggerPageNum + 1));
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

		if (absPageY > (this.tableHeaderHeight + ((this.rowsCount * this.rowHeight) - triggerOffset))) {
			if (this.state.firstRenderedRowID
			< (this.rowsCount - this.state.rowsPerPage * this.renderingPagesCount)) {
				this.setState({
					firstRenderedRowID: this.rowsCount - this.state.rowsPerPage * this.renderingPagesCount,
				});
			}
			this.lastScrollPos = absPageY;
			return;
		}

		const { top, bottom } = this.getPaddings();

		const scrollTriggered = (absPageY < (top + triggerOffset)
			|| absPageY > (bottom - triggerOffset));
		if (scrollTriggered) {
			let firstRenderedRowID = 0;
			const scrollUp = this.getScrollTop() < this.lastScrollPos;
			if (scrollUp) {
				const absTablePos = absPageY - this.tableHeaderHeight - this.rowHeight * 2;
				const scrollToPagesCount = this.renderingPagesCount + (triggerPageNum * 2);
				const scrollToPagesHeight = pageHeight * scrollToPagesCount;
				const scrollToTarget = absTablePos - scrollToPagesHeight;
				firstRenderedRowID = Math.floor(scrollToTarget / this.rowHeight);
				const scrollTargetPos = this.getScrollTop()
				+ (pageElemCount * this.rowHeight * triggerPageNum);
				this.ignoreScrollPos = scrollTargetPos;
				if (this.scrollbar) {
					this.scrollbar.scrollTop(scrollTargetPos);
				}
				this.setState({
					firstRenderedRowID: Math.max(firstRenderedRowID, 0),
				});
			} else {
				const absTablePos = absPageY - this.tableHeaderHeight - this.rowHeight * 2;
				const scrollToPagesCount = this.renderingPagesCount - triggerPageNum * 2;
				const scrollToPagesHeight = pageElemCount * this.rowHeight * scrollToPagesCount;
				const scrollToTarget = absTablePos - scrollToPagesHeight;
				firstRenderedRowID = Math.min(
					Math.ceil(scrollToTarget / this.rowHeight),
					this.rowsCount - this.state.rowsPerPage * this.renderingPagesCount
				);
				const scrollTargetPos = this.getScrollTop()
				- (pageElemCount * this.rowHeight * triggerPageNum);
				this.ignoreScrollPos = scrollTargetPos;
				if (this.scrollbar) {
					this.scrollbar.scrollTop(scrollTargetPos);
				}
				this.setState({
					firstRenderedRowID: Math.max(firstRenderedRowID, 0),
				});
			}
		}
		this.lastScrollPos = this.getScrollTop();
	}

	forceScroll = (): void => {
		if (this.scrollbar) {
			const s = this.scrollbar;
			const twoPages = this.state.rowsPerPage * 2;
			let scrollOffset = twoPages * this.rowHeight;
			scrollOffset = Math.max(scrollOffset, 0);
			scrollOffset = Math.min(scrollOffset,
			this.state.rowsPerPage * (this.renderingPagesCount - 1) * this.rowHeight);
			if (this.state.firstRenderedRowID < twoPages
			|| this.state.firstRenderedRowID > this.rowsCount - twoPages) {
				scrollOffset = this.state.firstRenderedRowID * this.rowHeight;
			}
			s.scrollTop(scrollOffset);
			if (this.state.forceScroll) {
				this.setState({
					forceScroll: false,
				});
			}
		}
	}

	componentDidUpdate(prevProps: Object, prevState: Object): void {
		if (prevState.rowsPerPage !== this.state.rowsPerPage || this.state.forceScroll) {
			this.forceScroll();
		}
	}

	componentDidMount() {
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

	handleScrollUpdate = (v: {
		thumbHeight: number; clientY: number; trackVerticalHeight: number;
	}) => {
		if (v.thumbHeight !== null) {
			const requestedRowID = Math.floor(v.clientY / v.trackVerticalHeight * this.rowsCount);
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
			this.rowsCount - 1 - this.renderingPagesCount * this.state.rowsPerPage);
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
		const requestedPosition = evY / viewportHeight * this.rowsCount * this.rowHeight;

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
		} = this.props;

		const rowHeight = this.rowHeight || 100;

		const { firstRenderedRowID: firstRowID = 0, rowsPerPage } = this.state;

		return (
			<Scrollbars
				ref={(ref: HTMLElement) => { this.scrollbar = ref; }}
				onScroll={this.handleScroll}
				renderTrackVertical={(props: Object) => this.buildVerticalTrack(props)}
				renderThumbVertical={(props: Object) => this.buildVerticalThumb(props)}
				scrollHeight={this.rowsCount * this.rowHeight}
				onUpdate={this.handleScrollUpdate}
				disableAutoScrollOnTrack
				scrollTopMod={this.scrollTopMod}
				handleDrag={this.handleDrag}
				style={{ height: `calc(100% - ${this.tableHeaderHeight}px)` }}>
				<div>
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
						renderingPagesCount={this.renderingPagesCount}
						/>
				</div>
			</Scrollbars>
		);
	}
}
