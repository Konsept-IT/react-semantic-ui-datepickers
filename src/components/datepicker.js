import React from 'react';
import PropTypes from 'prop-types';
import { formatDate, omit, pick, moveElementsByN } from '../utils';
import localeEn from '../locales/en-US';
import RangeDatePicker from '../pickers/range';
import SimpleDatePicker from '../pickers/simple';
import Calendar from './calendar';
import Input from './input';

const style = { display: 'inline-block' };
const semanticInputProps = [
  'disabled',
  'error',
  'icon',
  'iconPosition',
  'label',
  'labelPosition',
  'loading',
  'placeholder',
  'size',
  'transparent',
];

class SemanticDatepicker extends React.Component {
  static propTypes = {
    clearable: PropTypes.bool,
    date: PropTypes.instanceOf(Date),
    format: PropTypes.string,
    locale: PropTypes.object,
    onDateChange: PropTypes.func.isRequired,
    placeholder: PropTypes.string,
    type: PropTypes.oneOf(['simple', 'range']),
  };

  static defaultProps = {
    clearable: true,
    date: undefined,
    format: 'YYYY-MM-DD',
    locale: localeEn,
    placeholder: null,
    type: 'simple',
  };

  get isRangeInput() {
    return this.props.type === 'range';
  }

  get initialState() {
    return {
      isVisible: false,
      selectedDate: this.isRangeInput ? [] : null,
      selectedDateFormatted: '',
    };
  }

  get dayzedProps() {
    return omit(semanticInputProps, this.props);
  }

  get inputProps() {
    const props = pick(semanticInputProps, this.props);
    const placeholder = props.placeholder || this.props.format;

    return {
      ...props,
      placeholder,
    };
  }

  get weekdays() {
    const { firstDayOfWeek } = this.dayzedProps;
    const {
      locale: { weekdays },
    } = this.props;

    return moveElementsByN(firstDayOfWeek, weekdays);
  }

  state = this.initialState;

  Component = this.isRangeInput ? RangeDatePicker : SimpleDatePicker;

  resetState = () => {
    const { onDateChange } = this.props;

    this.setState(this.initialState, () => {
      onDateChange(null);
    });
  };

  mousedownCb = mousedownEvent => {
    const { isVisible } = this.state;

    if (isVisible && this.el) {
      if (!this.el.contains(mousedownEvent.target)) {
        this.close();
      }
    }
  };

  keydownCb = keydownEvent => {
    const { isVisible } = this.state;
    if (keydownEvent.keyCode === 27 && isVisible) {
      // Escape
      this.close();
    }
  };

  close = () => {
    window.removeEventListener('keydown', this.keydownCb);
    window.removeEventListener('mousedown', this.mousedownCb);

    this.setState({
      isVisible: false,
    });
  };

  showCalendar = event => {
    event.preventDefault();
    window.addEventListener('mousedown', this.mousedownCb);
    window.addEventListener('keydown', this.keydownCb);

    this.setState({
      isVisible: true,
    });
  };

  handleRangeInput = newDates => {
    const { format, onDateChange } = this.props;

    if (!newDates.length) {
      this.resetState();

      return;
    }

    const newState = {
      selectedDate: newDates,
      selectedDateFormatted: newDates
        .map(newDate => formatDate(newDate, format))
        .join(' - '),
    };

    this.setState(newState, () => {
      onDateChange(newDates);

      if (newDates.length === 2) {
        this.setState({ isVisible: false });
      }
    });
  };

  handleSimpleInput = newDate => {
    const { format, onDateChange } = this.props;

    if (!newDate) {
      this.setState(this.initialState, () => onDateChange(null));

      return;
    }

    const newState = {
      isVisible: false,
      selectedDate: newDate,
      selectedDateFormatted: formatDate(newDate, format),
    };

    this.setState(newState, () => {
      onDateChange(newDate);
    });
  };

  onDateSelected = (...args) => {
    if (this.isRangeInput) {
      this.handleRangeInput(...args);
    } else {
      this.handleSimpleInput(...args);
    }
  };

  render() {
    const { isVisible, selectedDate, selectedDateFormatted } = this.state;
    const { clearable, date, locale } = this.props;

    return (
      <div
        style={style}
        ref={el => {
          this.el = el;
        }}
      >
        <Input
          {...this.inputProps}
          isIconClickable={Boolean(clearable && selectedDateFormatted)}
          onClear={this.resetState}
          onClick={this.showCalendar}
          value={selectedDateFormatted}
        />
        {isVisible && (
          <this.Component
            {...this.dayzedProps}
            monthsToDisplay={this.isRangeInput ? 2 : 1}
            onChange={this.onDateSelected}
            selected={selectedDate}
            date={date}
          >
            {props => (
              <Calendar {...props} {...locale} weekdays={this.weekdays} />
            )}
          </this.Component>
        )}
      </div>
    );
  }
}

export default SemanticDatepicker;