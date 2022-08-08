import { SingleValue } from 'react-select';

export type OptionValueLabel<T> = SingleValue<{ value: T; label: string }>;
