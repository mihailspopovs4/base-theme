/**
 * ScandiPWA - Progressive Web App for Magento
 *
 * Copyright © Scandiweb, Inc. All rights reserved.
 * See LICENSE for license details.
 *
 * @license OSL-3.0 (Open Software License ("OSL") v. 3.0)
 * @package scandipwa/base-theme
 * @link https://github.com/scandipwa/base-theme
 */

import React, { PureComponent } from 'react';
import { withRouter } from 'react-router-dom';
import PropTypes from 'prop-types';
import ProductCard from 'Component/ProductCard';
import './CategoryProductListPlaceholder.style';

/**
 * Placeholder for List of category product
 * @class CategoryProductListPlaceholder
 */
class CategoryProductListPlaceholder extends PureComponent {
    constructor(props) {
        super(props);

        this.placeholdersCount = 4;
    }

    componentDidMount() {
        this.startObserving();
    }

    componentDidUpdate() {
        this.startObserving();
    }

    componentWillUnmount() {
        this.stopObserving();
    }

    startObserving() {
        const { updatePages } = this.props;

        if (this.node && !this.observer && 'IntersectionObserver' in window) {
            const options = {
                rootMargin: '0px',
                threshold: 0.1
            };

            this.observer = new IntersectionObserver(([{ intersectionRatio }]) => {
                if (intersectionRatio > 0) {
                    this.stopObserving();
                    updatePages();
                }
            }, options);

            this.observer.observe(this.node);
        }
    }

    stopObserving() {
        if (this.observer) {
            if (this.observer.unobserve && this.node) {
                this.observer.unobserve(this.node);
            }

            if (this.observer.disconnect) {
                this.observer.disconnect();
            }

            this.observer = null;
        }
    }

    renderPlaceholders() {
        return Array.from(
            { length: this.placeholdersCount },
            (_, i) => <ProductCard key={ i } product={ {} } />
        );
    }

    render() {
        const { isLoading, isVisible } = this.props;

        if (!isLoading && !isVisible) return null;

        return (
            <div
              block="CategoryProductListPlaceholder"
              ref={ isVisible ? (node) => { this.node = node; } : undefined }
            >
                { this.renderPlaceholders() }
            </div>
        );
    }
}

CategoryProductListPlaceholder.propTypes = {
    isLoading: PropTypes.bool.isRequired,
    isVisible: PropTypes.bool.isRequired,
    updatePages: PropTypes.func.isRequired
};

export default withRouter(CategoryProductListPlaceholder);
