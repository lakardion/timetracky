import { FC } from 'react';
import styles from './tw-spinner.module.css';

export const Spinner: FC<{
  sizeClassNames?: string;
  className?: string;
}> = ({ sizeClassNames = 'w-8 h-8', className = '' }) => {
  return <div className={`${styles['spinner-border']} inline-block animate-spin rounded-full border-4 ${sizeClassNames} ${className}`} role="status"></div>;
};

export const CenteredSpinner = () => {
  return (
    <section className="flex h-full w-full flex-col items-center justify-center">
      <Spinner />
    </section>
  );
};

/**
 * The parent of this component should be position-relative otherwise this is not going to work properly. It is based on the position relative of its parent so that it fills all the parent's space to position the loader and backdrop
 * @returns
 */
export const BackdropSpinner: FC<{
  isLoading: boolean;
  spinnerSizeClassNames?: string;
}> = ({ isLoading, spinnerSizeClassNames = 'w-8 h-8' }) => {
  if (!isLoading) return null;
  return (
    <div className="absolute flex h-full w-full items-center justify-center self-center">
      <div className="h-full w-full bg-gray-300" style={{ opacity: '50%' }}></div>
      <Spinner className="absolute" sizeClassNames={spinnerSizeClassNames} />
    </div>
  );
};
