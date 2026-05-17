import type { Core } from '@strapi/strapi';
import { errors } from '@strapi/utils';
import { RemoteSelectFetchOptions } from '../../../types/RemoteSelectFetchOptions';
import { OptionsProxyService } from '../services/OptionsProxy.service';
import { RemoteSelectFetchOptionsSchema } from '../validation/RemoteSelectFetchOptions.schema';

const { ValidationError } = errors;
export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async index(ctx: any): Promise<void> {
    try {
      const flexibleSelectConfig = (await RemoteSelectFetchOptionsSchema.validate(
        ctx.request.body,
        {
          strict: true,
          stripUnknown: true,
          abortEarly: false,
        }
      )) as any as RemoteSelectFetchOptions;

      ctx.body = await (
        strapi.plugin('remote-select').service('OptionsProxyService') as ReturnType<
          typeof OptionsProxyService
        >
      ).getOptionsByConfig(flexibleSelectConfig);
    } catch (error) {
      strapi.log.error('[remote-select] error name: ' + error.name);
      strapi.log.error('[remote-select] error message: ' + error.message);
      strapi.log.error('[remote-select] validation errors: ' + JSON.stringify(error.errors, null, 2));
      if (error.name === 'ValidationError')
        throw new ValidationError('Validation error', error.errors);
      throw error;
    }
  },
});
