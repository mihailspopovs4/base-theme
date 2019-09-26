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

import { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { CartDispatcher } from 'Store/Cart';
import { ProductType } from 'Type/ProductList';
import { WishlistDispatcher } from 'Store/Wishlist';
import { showNotification } from 'Store/Notification';

import AddToCart from './AddToCart.component';

export const mapStateToProps = state => ({
    wishlistItems: state.WishlistReducer.productsInWishlist,
    productToBeRemovedAfterAdd: state.WishlistReducer.productToBeRemovedAfterAdd
});

export const mapDispatchToProps = dispatch => ({
    addProduct: options => CartDispatcher.addProductToCart(dispatch, options),
    showNotification: (type, message) => dispatch(showNotification(type, message)),
    removeProductFromWishlist: options => WishlistDispatcher.removeItemFromWishlist(dispatch, options)
});

export class AddToCartContainer extends PureComponent {
    static propTypes = {
        isLoading: PropTypes.bool,
        product: ProductType.isRequired,
        quantity: PropTypes.number,
        configurableVariantIndex: PropTypes.number,
        groupedProductQuantity: PropTypes.objectOf(PropTypes.number),
        showNotification: PropTypes.func.isRequired,
        setQuantityToDefault: PropTypes.func,
        addProduct: PropTypes.func.isRequired,
        productToBeRemovedAfterAdd: PropTypes.string,
        removeProductFromWishlist: PropTypes.func.isRequired,
        wishlistItems: PropTypes.objectOf(ProductType).isRequired,
        removeWishlistItem: PropTypes.bool
    };

    static defaultProps = {
        quantity: 1,
        configurableVariantIndex: 0,
        groupedProductQuantity: {},
        setQuantityToDefault: () => {},
        productToBeRemovedAfterAdd: '',
        removeWishlistItem: false,
        isLoading: false
    };

    state = { isLoading: false };

    containerFunctions = {
        buttonClick: this.buttonClick.bind(this)
    };

    containerProps = () => ({
        isDisabled: this._getIsDisabled()
    });

    _getIsDisabled() {
        const {
            configurableVariantIndex,
            product: { type_id, stock_status, variants = [] }
        } = this.props;

        const { isLoading } = this.state;

        const isNotAvailable = stock_status !== 'IN_STOCK';
        const isNotVariantAvailable = type_id === 'configurable' && !variants[configurableVariantIndex];

        return isNotAvailable || isNotVariantAvailable || isLoading;
    }

    buttonClick() {
        const {
            product,
            configurableVariantIndex,
            groupedProductQuantity,
            quantity,
            addProduct
        } = this.props;
        const { variants, type_id } = product;

        this.setState({ isLoading: true });

        if (type_id === 'grouped') {
            const { items } = product;
            return Promise.all(items.map((item) => {
                // TODO: TEST
                const { product: groupedProductItem } = item;
                const {
                    items: deletedItems,
                    ...parentProduct
                } = product;

                groupedProductItem.parent = parentProduct;

                return addProduct({
                    product: groupedProductItem,
                    quantity: groupedProductQuantity[groupedProductItem.id]
                });
            })).then(() => this._afterAdded());
        }
        const productToAdd = variants
            ? {
                ...product,
                configurableVariantIndex
            }
            : product;

        return addProduct({
            product: productToAdd,
            quantity
        })
            .then(() => this._afterAdded())
            // Catch error to prevent error message in console
            .catch(() => {})
            .finally(() => this.setState({ isLoading: false }));
    }

    _afterAdded() {
        const {
            showNotification,
            setQuantityToDefault,
            productToBeRemovedAfterAdd,
            removeProductFromWishlist,
            wishlistItems,
            product,
            removeWishlistItem
        } = this.props;

        showNotification('success', 'Product added to cart!');
        setQuantityToDefault();

        const { sku, id } = product;

        // for configurable products productToBeRemovedAfterAdd will be saved in state
        if (removeWishlistItem || (productToBeRemovedAfterAdd === sku && wishlistItems[id])) {
            removeProductFromWishlist({ product: wishlistItems[id], noMessages: true });
        }
    }

    render() {
        return (
            <AddToCart
              { ...this.props }
              { ...this.state }
              { ...this.containerFunctions }
              { ...this.containerProps() }
            />
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(AddToCartContainer);
