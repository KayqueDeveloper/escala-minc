import * as React from "react";
import { cn } from "@/lib/utils";
import { 
  Calendar as ReactBigCalendar, 
  momentLocalizer,
  Views 
} from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

export interface Event {
  id: number;
  title: string;
  start: Date;
  end: Date;
  resourceId?: string;
  color?: string;
  allDay?: boolean;
}

export interface BigCalendarProps extends React.HTMLAttributes<HTMLDivElement> {
  events: Event[];
  onSelectEvent?: (event: Event) => void;
  onSelectSlot?: (slotInfo: any) => void;
  selectable?: boolean;
  defaultView?: string;
  defaultDate?: Date;
  views?: string[];
  formats?: any;
  className?: string;
  style?: React.CSSProperties;
}

const BigCalendar = React.forwardRef<HTMLDivElement, BigCalendarProps>(
  ({ 
    events, 
    onSelectEvent, 
    onSelectSlot, 
    selectable = true, 
    defaultView = Views.MONTH, 
    defaultDate = new Date(),
    views = [Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA],
    formats,
    className,
    ...props
  }, ref) => {
    const eventStyleGetter = (event: Event) => {
      const backgroundColor = event.color || '#3f51b5';
      const style = {
        backgroundColor,
        borderRadius: '5px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block'
      };
      return {
        style
      };
    };

    return (
      <div 
        ref={ref} 
        className={cn("overflow-auto bg-white rounded-lg shadow-sm", className)}
        {...props}
      >
        <ReactBigCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 700 }}
          onSelectEvent={onSelectEvent}
          onSelectSlot={onSelectSlot}
          selectable={selectable}
          defaultView={defaultView}
          defaultDate={defaultDate}
          views={views}
          formats={formats}
          eventPropGetter={eventStyleGetter}
        />
      </div>
    );
  }
);

BigCalendar.displayName = "BigCalendar";

export { BigCalendar };
