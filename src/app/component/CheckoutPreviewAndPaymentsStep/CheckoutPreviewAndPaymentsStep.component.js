/* eslint-disable react/no-unused-state */

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
import CheckoutPaymentMethods from 'Component/CheckoutPaymentMethods';
import Field from 'Component/Field';
import Form from 'Component/Form';
import Loader from 'Component/Loader';
import './CheckoutPreviewAndPaymentsStep.style';

export const FIRSTNAME_FIELD_ID = 'firstname';
export const LASTNAME_FIELD_ID = 'lastname';
export const COMPANY_FIELD_ID = 'company';
export const STREET_0_FIELD_ID = 'street_0';
export const STREET_1_FIELD_ID = 'street_1';
export const CITY_FIELD_ID = 'city';
export const REGION_FIELD_ID = 'region';
export const ZIP_FIELD_ID = 'postcode';
export const PHONE_FIELD_ID = 'telephone';
export const COUNTRY_FIELD_ID = 'country_id';
export const DEFAULT_COUNTRY = 'US';
export const DEFAULT_REGION = { region_code: 'AL', region: 'Alabama', region_id: 1 };

export const STATE_NEW_ADDRESS = 'newAddress';
export const STATE_DEFAULT_ADDRESS = 'defaultAddress';
export const STATE_SAME_ADDRESS = 'sameAddress';

export default class CheckoutPreviewAndPaymentsStep extends PureComponent {
    static propTypes = {
        shippingAddress: PropTypes.shape({
            city: PropTypes.string,
            company: PropTypes.string,
            country_id: PropTypes.string,
            email: PropTypes.string,
            firstname: PropTypes.string,
            lastname: PropTypes.string,
            postcode: PropTypes.string,
            region_id: PropTypes.number,
            street: PropTypes.array,
            telephone: PropTypes.string
        }).isRequired,
        billingAddress: PropTypes.shape({
            city: PropTypes.string,
            company: PropTypes.string,
            country_id: PropTypes.string,
            email: PropTypes.string,
            firstname: PropTypes.string,
            lastname: PropTypes.string,
            postcode: PropTypes.string,
            region_id: PropTypes.number,
            street: PropTypes.array,
            telephone: PropTypes.string
        }).isRequired,
        savePaymentInformationAndPlaceOrder: PropTypes.func.isRequired,
        paymentMethods: PropTypes.arrayOf(PropTypes.object).isRequired,
        finishedLoading: PropTypes.bool.isRequired,
        isSignedIn: PropTypes.bool.isRequired,
        countryList: PropTypes.arrayOf(PropTypes.shape).isRequired
    };

    constructor(props) {
        super(props);

        const {
            shippingAddress,
            billingAddress
        } = props;

        const { street } = billingAddress;

        this.state = {
            email: '',
            shippingAddress,
            billingAddress,
            street: { ...street },
            billingIsSame: false,
            selectedCountryIndex: null,
            country_id: null,
            activePaymentMethod: {},
            loadingPaymentInformationSave: false,
            defaultBillingAddress: false,
            regionList: [],
            state: STATE_NEW_ADDRESS
        };

        this.fieldMap = {
            [FIRSTNAME_FIELD_ID]: { label: __('First Name') },
            [LASTNAME_FIELD_ID]: { label: __('Last Name') },
            [COMPANY_FIELD_ID]: { label: __('Company'), validation: [] },
            [STREET_0_FIELD_ID]: {
                label: __('Street Address'),
                onChange: (street) => {
                    const { street: stateStreet } = this.state;
                    this.setState({ street: { ...stateStreet, 0: street } }, this.handleFieldChange);
                }
            },
            [STREET_1_FIELD_ID]: {
                onChange: (street) => {
                    const { street: stateStreet } = this.state;
                    this.setState({ street: { ...stateStreet, 1: street } }, this.handleFieldChange);
                },
                validation: []
            },
            [CITY_FIELD_ID]: { label: __('City') },
            [REGION_FIELD_ID]: {
                label: __('State'),
                validation: [],
                defaultValue: DEFAULT_REGION,
                onChange: (value) => {
                    const { regionList } = this.state;
                    if (typeof value === 'number') {
                        const regionValue = regionList.reduce((regionValue, region) => {
                            const { id: regionId } = region;

                            if (value === regionId) regionValue.push(region);

                            return regionValue;
                        }, []);
                        const { code: region_code, name: region, id: region_id } = regionValue[0];
                        const correctRegion = { region_code, region, region_id };

                        return this.setState({ region: correctRegion }, this.handleFieldChange);
                    }

                    const region = { region_code: value, region: value, region_id: 0 };
                    return this.setState({ region }, this.handleFieldChange);
                }
            },
            [ZIP_FIELD_ID]: { label: __('Postal Code') },
            [COUNTRY_FIELD_ID]: {
                label: __('Country'),
                type: 'select',
                defaultValue: DEFAULT_COUNTRY,
                onChange: (countryId) => {
                    this.getAvailableRegions(countryId);
                }
            },
            [PHONE_FIELD_ID]: {
                label: __('Phone Number'),
                validation: ['telephone']
            }
        };

        this.renderMap = {
            [STATE_NEW_ADDRESS]: () => (this.renderNewAddress()),
            [STATE_DEFAULT_ADDRESS]: () => (this.renderAddressPreview(STATE_DEFAULT_ADDRESS)),
            [STATE_SAME_ADDRESS]: () => (this.renderAddressPreview(STATE_SAME_ADDRESS))
        };
    }

    static getDerivedStateFromProps(state, props) {
        const { billingAddress, email, isSignedIn } = state;
        const { defaultBillingAddress } = props;

        if (Object.entries(billingAddress).length && !defaultBillingAddress) {
            return { billingAddress, defaultBillingAddress: true, state: STATE_DEFAULT_ADDRESS };
        }

        if (isSignedIn) return { email };

        return null;
    }

    componentDidUpdate() {
        const { defaultBillingAddress } = this.state;

        if (defaultBillingAddress) return this.handleFieldChange;

        return null;
    }

    onFormSuccess = () => {
        const { savePaymentInformationAndPlaceOrder } = this.props;
        const correctAddress = this.getAddressFromState();

        const { activePaymentMethod: { code: method } } = this.state;

        const paymentInformation = {
            paymentMethod: { method },
            billing_address: correctAddress
        };

        this.setState({ loadingPaymentInformationSave: true });

        savePaymentInformationAndPlaceOrder(paymentInformation);
    };

    onCountrySelectChange = (index) => {
        const { countryList } = this.props;

        this.setState({
            country_id: countryList[index].id,
            selectedCountryIndex: index
        }, this.handleFieldChange);
    };

    onRegionFieldChange = (region) => {
        this.setState({ region, region_id: null }, this.handleFieldChange);
    };

    onRegionIdFieldChange = (region_id) => {
        this.setState({
            region_id: parseInt(region_id, 10),
            region: null
        }, this.handleFieldChange);
    };

    onSameAsShippingChange = () => {
        const { billingIsSame } = this.state;

        this.setState(
            { billingIsSame: !billingIsSame },
            () => this.setState(({ billingIsSame }) => (
                billingIsSame
                    ? { state: STATE_SAME_ADDRESS }
                    : { state: STATE_NEW_ADDRESS }
            ))
        );
    };

    getAddressFromState() {
        const { state, billingAddress, shippingAddress } = this.state;

        switch (state) {
        case STATE_DEFAULT_ADDRESS:
            return this.trimAddress(billingAddress);
        case STATE_SAME_ADDRESS:
            return this.trimAddress(shippingAddress);
        default:
            return this.trimAddress(this.state);
        }
    }

    getButtonParams() {
        const { state, defaultBillingAddress } = this.state;
        const { isSignedIn } = this.props;

        if (defaultBillingAddress) {
            if (state === 'newAddress') {
                return { message: (__("I'd like to use the default address")), type: STATE_DEFAULT_ADDRESS };
            }

            if (isSignedIn) {
                return { message: (__("I'd like to use a different address")), type: STATE_NEW_ADDRESS };
            }
        }

        return null;
    }

    handleSelectPaymentMethod = (method) => {
        this.setState({ activePaymentMethod: method });
    };

    trimAddress(address) {
        const { email: stateEmail, shippingAddress: { email: shippingEmail } } = this.state;
        const {
            city,
            company,
            country_id,
            firstname,
            lastname,
            postcode,
            region,
            street,
            telephone
        } = address;

        const { region_id, region_code } = region || address;
        const email = stateEmail || shippingEmail;

        return {
            city,
            company,
            country_id,
            email,
            firstname,
            lastname,
            postcode,
            region_id,
            region_code,
            street: Object.values(street),
            telephone
        };
    }

    changeState(state, billingValue) {
        const { shippingAddress, defaultBillingAddress } = this.state;
        const { billingAddress } = this.props;

        if (state === STATE_SAME_ADDRESS) {
            return this.setState({ state, billingAddress: shippingAddress, billingIsSame: billingValue });
        }

        if (state === STATE_DEFAULT_ADDRESS && !defaultBillingAddress) {
            return this.setState({ state: STATE_NEW_ADDRESS, billingAddress: {}, billingIsSame: billingValue });
        }

        if (state === STATE_DEFAULT_ADDRESS && defaultBillingAddress) {
            return this.setState({ state, billingAddress, billingIsSame: billingValue });
        }

        return this.setState({ state, billingIsSame: billingValue });
    }

    renderField(id, overrideStateValue) {
        const { [id]: stateValue } = this.state;
        const {
            type = 'text',
            label,
            placeholder,
            note,
            name,
            validation = ['notEmpty'],
            onChange = value => this.setState({ [id]: value }, this.handleFieldChange)
        } = this.fieldMap[id];

        return (
            <Field
              id={ id }
              type={ type }
              label={ label }
              placeholder={ placeholder }
              note={ note }
              name={ name || id }
              value={ overrideStateValue || stateValue }
              validation={ validation }
              onChange={ onChange }
            />
        );
    }

    renderCountrySelect() {
        const { countryList } = this.props;
        const { selectedCountryIndex } = this.state;

        return (
            <Field
              id={ COUNTRY_FIELD_ID }
              name={ COUNTRY_FIELD_ID }
              type="select"
              placeholder="Country"
              selectOptions={ countryList.map(({ id, label }, index) => ({ id, label, value: index })) }
              validation={ ['notEmpty'] }
              value={ selectedCountryIndex }
              onChange={ this.onCountrySelectChange }
            />
        );
    }

    renderRegionField() {
        const { selectedCountryIndex, region, region_id } = this.state;
        const { countryList } = this.props;
        const regions = selectedCountryIndex ? countryList[selectedCountryIndex].available_regions : null;

        if (regions) {
            return (
                <Field
                  id={ REGION_FIELD_ID }
                  name={ REGION_FIELD_ID }
                  type="select"
                  placeholder="State"
                  selectOptions={ regions.map(({ id, name }) => ({ id, label: name, value: id })) }
                  validation={ ['notEmpty'] }
                  value={ region_id }
                  onChange={ this.onRegionIdFieldChange }
                />
            );
        }

        return (
            <Field
              id={ REGION_FIELD_ID }
              name={ REGION_FIELD_ID }
              type="text"
              placeholder="Region"
              onChange={ this.onRegionFieldChange }
              value={ region }
            />
        );
    }

    renderAddressPreview(addressType) {
        const { shippingAddress, billingAddress } = this.state;
        const correctAddress = (addressType === 'sameAddress') ? shippingAddress : billingAddress;
        const {
            street,
            city,
            postcode,
            country_id
        } = correctAddress;

        const address = [country_id, city, street[0], postcode];

        return (
            <>
                <address
                  block="CheckoutPreviewAndPaymentsStep"
                  elem="ShippingAddressPreview"
                >
                    <dl>
                        <dt>{ __('Billing address:') }</dt>
                        <dd>{ address.filter(s => !!s).join(', ') }</dd>
                    </dl>
                </address>
            </>
        );
    }

    renderNewAddress() {
        const { street } = this.state;

        return (
            <>
                { this.renderField(FIRSTNAME_FIELD_ID) }
                { this.renderField(LASTNAME_FIELD_ID) }
                { this.renderField(COMPANY_FIELD_ID) }
                { this.renderField(STREET_0_FIELD_ID, street[0]) }
                { this.renderField(CITY_FIELD_ID) }
                { this.renderRegionField() }
                { this.renderField(ZIP_FIELD_ID) }
                { this.renderCountrySelect() }
                { this.renderField(PHONE_FIELD_ID) }
            </>
        );
    }

    renderStateButton() {
        const buttonsParams = this.getButtonParams();

        return (
            buttonsParams && (
                <button
                  type="button"
                  onClick={ () => this.changeState(buttonsParams.type, false) }
                >
                    { buttonsParams.message }
                </button>
            )
        );
    }

    render() {
        const { finishedLoading, paymentMethods } = this.props;
        const {
            billingIsSame,
            activePaymentMethod,
            shippingAddress,
            state,
            loadingPaymentInformationSave
        } = this.state;
        const renderFunction = this.renderMap[state];
        const { code } = activePaymentMethod;

        return (
            <Form
              mix={ { block: 'CheckoutPreviewAndPaymentsStep' } }
              onSubmitSuccess={ this.onFormSuccess }
              key="review_and_payment_step"
            >
                <Loader isLoading={ loadingPaymentInformationSave } />

                <fieldset>
                    <legend block="CheckoutPage" elem="Heading" mods={ { hasDivider: true } }>
                        { __('1. Shipping') }
                    </legend>

                    { this.renderStateButton() }

                    { shippingAddress && !!Object.entries(shippingAddress).length && (
                        <Field
                          id="sameAsShippingAddress"
                          name="sameAsShippingAddress"
                          type="checkbox"
                          label={ __('My billing and shipping are the same') }
                          value="sameAsShippingAddress"
                          checked={ !!billingIsSame }
                          onChange={ this.onSameAsShippingChange }
                        />
                    ) }

                    { renderFunction() }
                </fieldset>

                <div>
                    <Loader isLoading={ !finishedLoading } />

                    <CheckoutPaymentMethods
                      paymentMethods={ paymentMethods }
                      onSelectPaymentMethod={ this.handleSelectPaymentMethod }
                    />
                </div>

                <button
                  type="submit"
                  block="Button"
                  disabled={ !code }
                >
                    { __('Place Order') }
                </button>
            </Form>
        );
    }
}
