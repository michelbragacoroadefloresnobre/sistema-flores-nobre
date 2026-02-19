export type CreatePagarmeOrderPayment = {
    customer: {
        address: {
            country: string;
            state: string;
            city: string;
            zip_code: string;
            line_1: string;
        };
        phones: {
            mobile_phone: {
                country_code: string;
                area_code: string;
                number: string;
            };
        };
        name: string;
        email: string;
        document: string;
        type: string;
        code?: string;
        document_type: string;
    };
    code?: string;
    items: {
        amount: number;
        description: string;
        quantity: number;
        code: string;
    }[];
    payments: any;
}

export interface PagarmeOrderResponse {
    id: string;
    code: string;
    amount: number;
    currency: string;
    closed: boolean;
    items: Array<{
        id: string;
        type: string;
        description: string;
        amount: number;
        quantity: number;
        status: string;
        created_at: string;
        updated_at: string;
        code: string;
    }>;
    customer: {
        id: string;
        name: string;
        email: string;
        code: string;
        document: string;
        document_type: string;
        type: string;
        delinquent: boolean;
        address: {
            id: string;
            line_1: string;
            zip_code: string;
            city: string;
            state: string;
            country: string;
            status: string;
            created_at: string;
            updated_at: string;
        };
        created_at: string;
        updated_at: string;
        phones: {
            mobile_phone: {
                country_code: string;
                number: string;
                area_code: string;
            };
        };
    };
    status: string;
    created_at: string;
    updated_at: string;
    closed_at?: string;
    charges: Array<{
        id: string;
        code: string;
        amount: number;
        status: string;
        currency: string;
        payment_method: string;
        created_at: string;
        updated_at: string;
        customer: {
            id: string;
            name: string;
            email: string;
            code: string;
            document: string;
            document_type: string;
            type: string;
            delinquent: boolean;
            address: {
                id: string;
                line_1: string;
                zip_code: string;
                city: string;
                state: string;
                country: string;
                status: string;
                created_at: string;
                updated_at: string;
            };
            created_at: string;
            updated_at: string;
            phones: {
                mobile_phone: {
                    country_code: string;
                    number: string;
                    area_code: string;
                };
            };
        };
        last_transaction: {
            expires_at?: string;
            id: string;
            transaction_type: string;
            amount: number;
            status: string;
            success: boolean;
            created_at: string;
            updated_at: string;
            gateway_response: {
                code: string;
                errors?: Array<{
                    message: string;
                }>;
            };
            antifraud_response: Record<string, any>;
            metadata: Record<string, any>;
            qr_code?: string;
            qr_code_url?: string;
            line?: string;
            barcode?: string;
            pdf?: string;
            url?: string;
        };
    }>;
}

export interface PagarmeChargeResponse {
    id: string;
    code: string;
    amount: number;
    status: string;
    currency: string;
    payment_method: string;
    created_at: string;
    updated_at: string;
    customer: {
        id: string;
        name: string;
        email: string;
        code: string;
        document: string;
        document_type: string;
        type: string;
        delinquent: boolean;
        address: {
            id: string;
            line_1: string;
            zip_code: string;
            city: string;
            state: string;
            country: string;
            status: string;
            created_at: string;
            updated_at: string;
        };
        created_at: string;
        updated_at: string;
        phones: {
            mobile_phone: {
                country_code: string;
                number: string;
                area_code: string;
            };
        };
    };
    last_transaction: {
        expires_at?: string;
        id: string;
        transaction_type: string;
        amount: number;
        status: string;
        success: boolean;
        created_at: string;
        updated_at: string;
        gateway_response: {
            code: string;
            errors?: Array<{
                message: string;
            }>;
        };
        antifraud_response: Record<string, any>;
        metadata: Record<string, any>;
        qr_code?: string;
        qr_code_url?: string;
        line?: string;
        barcode?: string;
        pdf?: string;
        url?: string;
    };
}