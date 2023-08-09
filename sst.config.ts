import { SSTConfig } from 'sst';
import { VirtualOfficeStack } from './stacks/VirtualOfficeStack';

export default {
    config(_input) {
        return {
            name: 'virtual-office-api',
            region: process.env.AWS_REGION,
        };
    },
    stacks(app) {
        app.stack(VirtualOfficeStack);
    },
} satisfies SSTConfig;
