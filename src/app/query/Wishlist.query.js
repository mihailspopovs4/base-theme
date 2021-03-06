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

import { Field } from 'Util/Query';
import { ProductListQuery } from 'Query';

export class Wishlist {
    getWishlistQuery() {
        return new Field('wishlist')
            .addFieldList(this._getWishlistFields());
    }

    getAddProductToWishlistMutation({ sku }) {
        return new Field('addProductToWishlist')
            .addArgument('productSku', 'String!', sku)
            .addFieldList(this._getItemFields());
    }

    getRemoveProductFromWishlistMutation({ item_id }) {
        return new Field('removeProductFromWishlist')
            .addArgument('itemId', 'String!', item_id);
    }

    _getWishlistFields() {
        return [
            'items_count',
            'updated_at',
            this._getItemsField()
        ];
    }

    _getItemFields() {
        return [
            'id',
            this._getProductField()
        ];
    }

    _getProductField() {
        return new Field('product')
            .addFieldList(ProductListQuery._getProductInterfaceFields());
    }

    _getItemsField() {
        return new Field('item')
            .addFieldList(this._getItemFields());
    }
}

export default new Wishlist();
