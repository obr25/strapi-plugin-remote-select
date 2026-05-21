import {
  DesignSystemProvider,
  Field,
  MultiSelect,
  MultiSelectOption,
  SingleSelect,
  SingleSelectOption,
  useDesignSystem,
} from '@strapi/design-system';
import type { MouseEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { useTheme } from 'styled-components';
import { FlexibleSelectConfig } from '../../../../types/FlexibleSelectConfig';
import { SearchableRemoteSelectValue } from '../../../../types/SearchableRemoteSelectValue';
import { useRemoteSelectApi } from '../../utils/remoteSelectApi';

function RemoteSelectComponent({
  value,
  onChange,
  name,
  label,
  required,
  attribute,
  hint,
  placeholder,
  disabled,
  error,
}: any) {
  const defaultPlaceholder = {
    id: 'remote-select.select.placeholder',
    defaultMessage: 'Select a value',
  };
  const selectConfiguration: FlexibleSelectConfig = attribute.options;

  const { formatMessage } = useIntl();
  const isMulti = useMemo<boolean>(
    () => attribute.customField === 'plugin::remote-select.remote-select-multi',
    [attribute]
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [options, setOptions] = useState<Array<SearchableRemoteSelectValue>>([]);
  const [optionsLoadingError, setLoadingError] = useState<any | undefined>();
  const requestIdRef = useRef(0);
  const { loadOptions: loadRemoteOptions } = useRemoteSelectApi();

  const valueParsed = useMemo<string | string[]>(() => {
    if (!value) {
      return isMulti ? [] : '';
    }

    if (isMulti) {
      // Multi mode: type 'json' returns actual array
      if (!Array.isArray(value)) {
        return [];
      }
      return value;
    }

    // Single mode: type 'text' returns plain string
    return typeof value === 'string' ? value : '';
  }, [value, isMulti]);

  useEffect(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    loadOptions(requestId);

    return () => {
      requestIdRef.current += 1;
    };
  }, []);

  async function loadOptions(requestId: number): Promise<void> {
    setIsLoading(true);
    try {
      const loadedOptions = await loadRemoteOptions(selectConfiguration);

      if (requestId === requestIdRef.current) {
        setOptions(loadedOptions);
        setLoadingError(undefined);
      }
    } catch (err) {
      if (requestId === requestIdRef.current) {
        setLoadingError((err as any)?.message || err?.toString());
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }

  function handleChange(value?: string | string[] | number) {
    let finalValue: any;

    if (isMulti) {
      // Multi mode: type 'json' stores actual array (no stringify)
      const arrayValue = Array.isArray(value) ? value : [];
      const filtered = arrayValue.filter((el) => el !== undefined && el !== null);
      finalValue = filtered.length ? filtered : required ? undefined : [];
    } else {
      // Single mode: type 'text' stores plain string
      finalValue = value ? String(value) : required ? undefined : null;
    }

    onChange({
      target: { name, type: attribute.type, value: finalValue },
    });
  }

  function clear(event: MouseEvent<HTMLButtonElement | HTMLDivElement>) {
    event.stopPropagation();
    event.preventDefault();
    handleChange(undefined);
  }

  const optionsList = options.map((opt) => {
    return isMulti ? (
      <MultiSelectOption value={opt.value} key={opt.value}>
        {opt.label}
      </MultiSelectOption>
    ) : (
      <SingleSelectOption value={opt.value} key={opt.value}>
        {opt.label}
      </SingleSelectOption>
    );
  });

  return (
    <Field.Root name={name} hint={hint} required={required} error={error}>
      <Field.Label>{label}</Field.Label>
      {isMulti ? (
        <MultiSelect
          withTags
          placeholder={placeholder || formatMessage(defaultPlaceholder)}
          aria-label={label}
          name={name}
          onChange={handleChange}
          value={Array.isArray(valueParsed) ? valueParsed : []}
          disabled={disabled}
          required={required}
          onClear={clear}
          loading={isLoading ?? true}
        >
          {optionsLoadingError &&
            `Options loading error: ${optionsLoadingError}. Please check the field configuration`}
          {optionsList}
        </MultiSelect>
      ) : (
        <SingleSelect
          placeholder={placeholder || formatMessage(defaultPlaceholder)}
          aria-label={label}
          name={name}
          onChange={handleChange}
          value={typeof valueParsed === 'string' ? valueParsed : ''}
          disabled={disabled}
          required={required}
          onClear={clear}
          loading={isLoading ?? true}
        >
          {optionsLoadingError &&
            `Options loading error: ${optionsLoadingError}. Please check the field configuration`}
          {optionsList}
        </SingleSelect>
      )}
      <Field.Error />
      <Field.Hint />
    </Field.Root>
  );
}

export default function RemoteSelect(props: any) {
  const theme = useTheme();
  const designSystem = useDesignSystem('RemoteSelect');

  return (
    <DesignSystemProvider locale={designSystem?.locale || 'en'} theme={theme}>
      <RemoteSelectComponent {...props} />
    </DesignSystemProvider>
  );
}
