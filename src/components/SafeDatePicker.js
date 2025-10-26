import React from 'react';
import { TextField } from '@mui/material';
import { LocalizationProvider, MobileDatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { isValidDate, safeFormatDate } from '../utils/dateUtils';

const SafeDatePicker = ({
  label = 'Select Date',
  value,
  onChange,
  minDate = null,
  maxDate = null,
  disabled = false,
  required = false,
  fullWidth = true,
  variant = 'outlined',
  margin = 'normal',
  ...props
}) => {
  const [internalValue, setInternalValue] = React.useState(null);
  const [error, setError] = React.useState('');

  // Format the value for the picker
  const formatForPicker = (date) => {
    if (!date) return null;
    try {
      return safeFormatDate(date, 'yyyy-MM-dd');
    } catch (e) {
      return null;
    }
  };

  // Handle date changes
  const handleDateChange = (newValue) => {
    setInternalValue(newValue);
    
    if (!newValue) {
      setError(required ? 'Date is required' : '');
      onChange(null);
      return;
    }

    // Validate the date
    if (!isValidDate(newValue)) {
      setError('Please select a valid date');
      return;
    }

    // Check min date
    if (minDate && new Date(newValue) < new Date(minDate)) {
      setError(`Date must be after ${safeFormatDate(minDate, 'dd/MM/yyyy')}`);
      return;
    }

    // Check max date
    if (maxDate && new Date(newValue) > new Date(maxDate)) {
      setError(`Date must be before ${safeFormatDate(maxDate, 'dd/MM/yyyy')}`);
      return;
    }

    setError('');
    onChange(newValue);
  };

  // Format the display value
  const formatDisplayValue = (date) => {
    if (!date) return '';
    return safeFormatDate(date, 'dd/MM/yyyy');
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <MobileDatePicker
        label={label}
        value={internalValue}
        onChange={handleDateChange}
        inputFormat="dd/MM/yyyy"
        renderInput={(params) => (
          <TextField
            {...params}
            fullWidth={fullWidth}
            variant={variant}
            margin={margin}
            error={!!error}
            helperText={error || props.helperText}
            required={required}
            disabled={disabled}
            inputProps={{
              ...params.inputProps,
              placeholder: 'DD/MM/YYYY',
              readOnly: true, // Prevent manual input
            }}
          />
        )}
        minDate={minDate ? new Date(minDate) : null}
        maxDate={maxDate ? new Date(maxDate) : null}
        disablePast={props.disablePast}
        disabled={disabled}
        {...props}
      />
    </LocalizationProvider>
  );
};

export default SafeDatePicker;
