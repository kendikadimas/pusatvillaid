export type Passkey = {
    id: number;
    name: string;
    authenticator?: string;
    created_at_diff: string;
    last_used_at_diff?: string;
};
