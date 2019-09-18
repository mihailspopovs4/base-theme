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
import { connect } from 'react-redux';
import { GUEST_QUOTE_ID, CartDispatcher } from 'Store/Cart';
import { fetchMutation, fetchQuery } from 'Util/Request';
import CheckoutQuery from 'Query/Checkout.query';
import BrowserDatabase from 'Util/BrowserDatabase';
import { MyAccountDispatcher } from 'Store/MyAccount';
import { changeHeaderState } from 'Store/Header';
import { toggleBreadcrumbs } from 'Store/Breadcrumbs';
import { showNotification } from 'Store/Notification';
import CheckoutPage from './CheckoutPage.component';

const mapStateToProps = state => ({
    products: state.CartReducer.productsInCart,
    totals: state.CartReducer.cartTotals,
    toggleHeaderAndFooter: state.HeaderAndFooterReducer.toggleHeaderAndFooter,
    isSignedIn: state.MyAccountReducer.isSignedIn,
    customer: state.MyAccountReducer.customer,
    countryList: state.ConfigReducer.countries
});

const mapDispatchToProps = dispatch => ({
    removeCartAndObtainNewGuest: () => {
        BrowserDatabase.deleteItem(GUEST_QUOTE_ID);
        CartDispatcher.updateInitialCartData(dispatch);
    },
    toggleBreadcrumbs: () => dispatch(toggleBreadcrumbs(false)),
    setHeaderState: stateName => dispatch(changeHeaderState(stateName)),
    requestCustomerData: options => MyAccountDispatcher.requestCustomerData(options, dispatch),
    showNotification: (type, message) => dispatch(showNotification(type, message))
});

const MappedCheckoutPage = connect(mapStateToProps, mapDispatchToProps)(CheckoutPage);

class CheckoutPageContainer extends PureComponent {
    containerFunctions = {
        saveAddressInformation: this.saveAddressInformation.bind(this),
        savePaymentInformationAndPlaceOrder: this.savePaymentInformationAndPlaceOrder.bind(this),
        getPaymentInformation: this.getPaymentInformation.bind(this)
    };

    getGuestCartId = () => BrowserDatabase.getItem(GUEST_QUOTE_ID);

    getPaymentInformation() {
        return fetchQuery(CheckoutQuery.getPaymentInformation(this.getGuestCartId()));
    }

    saveAddressInformation(addressInformation) {
        return fetchMutation(CheckoutQuery.getSaveAddressInformation(addressInformation, this.getGuestCartId()));
    }

    savePaymentInformationAndPlaceOrder(paymentInformation) {
        return fetchMutation(CheckoutQuery
            .getSavePaymentInformationAndPlaceOrder(paymentInformation, this.getGuestCartId()));
    }

    render() {
        return (
            <MappedCheckoutPage
              { ...this.props }
              { ...this.containerFunctions }
            />
        );
    }
}

export default CheckoutPageContainer;
