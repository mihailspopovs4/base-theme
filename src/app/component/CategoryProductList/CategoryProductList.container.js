import React, { PureComponent } from 'react';
import { withRouter } from 'react-router-dom';
import { getQueryParam } from 'Util/Url';
import PropTypes from 'prop-types';
import { PagesType } from 'Type/ProductList';
import CategoryProductList from './CategoryProductList.component';

export class CategoryProductListContainer extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            pagesCount: 1
        };

        this.containerFunctions = {
            loadPrevPage: this.loadPage.bind(this, false),
            loadPage: this.loadPage.bind(this)
        };

        this.containerProps = () => ({
            currentPage: this._getPageFromUrl(),
            isShowLoading: this._isShowLoading(),
            isVisible: this._isVisible()
        });
    }

    componentDidMount() {
        const { pages } = this.props;
        const { pagesCount } = this.state;
        const pagesLength = Object.keys(pages).length;

        if (pagesCount !== pagesLength) {
            this.setState({ pagesCount: pagesLength });
        }
    }

    static getDerivedStateFromProps(props) {
        const { isLoading } = props;
        if (isLoading) return { pagesCount: 1 };
        return null;
    }

    _getPageFromUrl() {
        const { location } = this.props;
        return +(getQueryParam('page', location) || 1);
    }

    _getPagesBounds() {
        const { pages } = this.props;
        const keys = Object.keys(pages);

        return {
            maxPage: Math.max(...keys),
            minPage: Math.min(...keys),
            loadedPagesCount: keys.length
        };
    }

    _isShowLoading() {
        const { isLoading } = this.props;
        const { minPage } = this._getPagesBounds();
        return minPage > 1 && !isLoading;
    }

    _isVisible() {
        const { totalPages } = this.props;
        const { maxPage } = this._getPagesBounds();
        return maxPage < totalPages;
    }

    loadPage(next = true) {
        const { pagesCount } = this.state;
        const { loadPage, totalPages, isLoading } = this.props;
        const { minPage, maxPage, loadedPagesCount } = this._getPagesBounds();

        const isUpdatable = totalPages > 0 && pagesCount === loadedPagesCount;
        const shouldUpdateList = next ? maxPage < totalPages : minPage > 1;

        if (isUpdatable && shouldUpdateList && !isLoading) {
            this.setState({ pagesCount: pagesCount + 1 });
            loadPage(next ? maxPage + 1 : minPage - 1);
        }
    }

    render() {
        return (
            <CategoryProductList
              { ...this.props }
              { ...this.containerFunctions }
              { ...this.containerProps() }
            />
        );
    }
}

CategoryProductListContainer.propTypes = {
    location: PropTypes.shape({
        pathname: PropTypes.string.isRequired
    }).isRequired,
    pages: PagesType.isRequired,
    loadPage: PropTypes.func.isRequired,
    isLoading: PropTypes.bool.isRequired,
    totalPages: PropTypes.number.isRequired
};

export default withRouter(CategoryProductListContainer);
