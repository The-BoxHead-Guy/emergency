import { useId, useState } from 'react';
import type { ChangeEvent } from 'react';
import {
  formatVenezuelanPhone,
  isValidVenezuelanPhone,
  normalizeVenezuelanPhone,
  toVenezuelanE164,
} from '@/core/phone';
import { EmergencyFooter } from '@/react/components/EmergencyFooter';
import { EmergencyHeader } from '@/react/components/EmergencyHeader';
import { Icon } from '@/react/components/Icon';
import { cls } from '@/react/classnames';
import { useScreenNavigation } from '@/react/screens/context';
import { preEmergencyCopy } from '@/react/screens/pre-emergency/copy';
import { EmergencyScreenLayout } from '@/react/screens/layout';
import type { EmergencyScreenProps } from '@/react/screens/types';

export function PreEmergencyScreen(props: EmergencyScreenProps) {
  const { back } = useScreenNavigation();
  const phoneId = useId();
  const errorId = `${phoneId}-error`;
  const permissionId = `${phoneId}-permission`;
  const [digits, setDigits] = useState('');
  const [touched, setTouched] = useState(false);
  const valid = isValidVenezuelanPhone(digits);
  const invalid = touched && digits.length > 0 && !valid;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = normalizeVenezuelanPhone(event.target.value).slice(0, 10);

    setDigits(next);
  };

  const handleSubmit = () => {
    setTouched(true);

    if (!valid) {
      return;
    }

    const phone = toVenezuelanE164(digits);

    if (phone === null) {
      return;
    }

    props.onSetContactPhone(phone);
    props.onActivate();
  };

  return (
    <EmergencyScreenLayout
      screen="pre-emergency"
      titleId={props.titleId}
      bodyClassName="emergency-panel__body--pre-emergency"
      header={
        <EmergencyHeader
          titleId={props.titleId}
          title={preEmergencyCopy.title}
          onClose={() => props.onClose('close')}
          onBack={back}
        />
      }
      footer={
        <EmergencyFooter
          active={props.active}
          busy={props.busy}
          aborting={props.aborting}
          feedbackVisible={props.feedbackVisible}
          emergencyDisabled={!valid}
          showSimulation={false}
          onActivate={handleSubmit}
          onRequestAbort={props.onRequestAbort}
          onRequestSimulation={props.onRequestSimulation}
        />
      }
    >
      <div className={cls('emergency-pre-emergency')}>
        <section
          role="note"
          aria-labelledby={permissionId}
          className={cls('emergency-pre-emergency__notice')}
        >
          <Icon
            name="map-pin"
            className={cls('emergency-pre-emergency__notice-icon')}
          />
          <p
            id={permissionId}
            className={cls('emergency-pre-emergency__notice-text')}
          >
            {preEmergencyCopy.permissionNotice}
          </p>
        </section>

        <form
          className={cls('emergency-pre-emergency__form')}
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            handleSubmit();
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              handleSubmit();
            }
          }}
        >
          <label
            htmlFor={phoneId}
            className={cls('emergency-pre-emergency__label')}
          >
            {preEmergencyCopy.phoneLabel}
          </label>
          <div className={cls('emergency-pre-emergency__phone-row')}>
            <input
              type="tel"
              aria-label={preEmergencyCopy.areaCodeLabel}
              className={cls(
                'emergency-pre-emergency__input',
                'emergency-pre-emergency__input--area-code',
                valid && 'emergency-pre-emergency__input--valid',
              )}
              value={preEmergencyCopy.areaCode}
              disabled
              readOnly
            />
            <input
              id={phoneId}
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              placeholder={preEmergencyCopy.phonePlaceholder}
              className={cls(
                'emergency-pre-emergency__input',
                'emergency-pre-emergency__input--number',
                valid && 'emergency-pre-emergency__input--valid',
                invalid && 'emergency-pre-emergency__input--invalid',
              )}
              value={formatVenezuelanPhone(digits)}
              aria-invalid={invalid}
              aria-describedby={invalid ? errorId : undefined}
              onChange={handleChange}
              onBlur={() => setTouched(true)}
            />
          </div>
          {invalid ? (
            <p
              id={errorId}
              role="alert"
              className={cls('emergency-pre-emergency__error')}
            >
              {preEmergencyCopy.invalidPhone}
            </p>
          ) : null}
        </form>
      </div>
    </EmergencyScreenLayout>
  );
}
