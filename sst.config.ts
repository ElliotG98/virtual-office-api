import { SSTConfig } from 'sst';
import { VirtualOfficeStack } from './stacks/VirtualOfficeStack';

export default {
  config(_input) {
    return {
      name: 'virtual-office-api',
      region: 'us-east-1',
    };
  },
  stacks(app) {
    app.stack(VirtualOfficeStack);
  },
} satisfies SSTConfig;
