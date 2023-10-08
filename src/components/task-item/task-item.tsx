import React, { useEffect, useRef, useState } from "react";
import { BarTask } from "../../types/bar-task";
import { GanttContentMoveAction } from "../../types/gantt-task-actions";
import { Bar } from "./bar/bar";
import { BarSmall } from "./bar/bar-small";
import { Milestone } from "./milestone/milestone";
import { Project } from "./project/project";
import style from "./task-list.module.css";

export type TaskItemProps = {
  task: BarTask;
  arrowIndent: number;
  taskHeight: number;
  isProgressChangeable: boolean;
  isDateChangeable: boolean;
  isDelete: boolean;
  isSelected: boolean;
  rtl: boolean;
  isHorizontalDisplay: boolean;
  viewMode: ViewMode;
  onEventStart: (
    action: GanttContentMoveAction,
    selectedTask: BarTask,
    event?: React.MouseEvent | React.KeyboardEvent
  ) => any;
};

export const TaskItem: React.FC<TaskItemProps> = props => {
  const {
    task,
    arrowIndent,
    isDelete,
    taskHeight,
    isSelected,
    rtl,
    isHorizontalDisplay,
    viewMode,
    onEventStart,
  } = {
    ...props,
  };
  const textRef = useRef<SVGTextElement>(null);
  const displayNameShortenedRef = useRef(null);
  const [taskItem, setTaskItem] = useState<JSX.Element>(<div />);
  const [isTextInside, setIsTextInside] = useState(true);

  useEffect(() => {
    switch (task.typeInternal) {
      case "milestone":
        setTaskItem(<Milestone {...props} />);
        break;
      case "project":
        setTaskItem(<Project {...props} />);
        break;
      case "smalltask":
        setTaskItem(<BarSmall {...props} />);
        break;
      default:
        setTaskItem(<Bar {...props} />);
        break;
    }
  }, [task, isSelected]);

  useEffect(() => {
    // Ivo Sturm: added feature if displayName is too large, shortens the text to make it fit in the bar and adds 3 bullets to let user know it is shortened
    let isTextInside = true;
    // Check 1: If task bar size is less than 30, don't put any text in
    if ((task.x2 - task.x1) < 30){
      isTextInside = false;
      displayNameShortenedRef.current = null;
    }
    else if (textRef.current) {
      // Check 2: At first render the textRef bounding box will reflect the actual size of the displayname. Check whether this fits in the width of the bar of the task
      const deltaWidth = textRef.current.getBBox().width - (task.x2 - task.x1);
      if (Math.floor(deltaWidth / 6) >=1){
        // remove 3 extra characters, since we will add three dots to let user know name is longer than displayed
        const charsToBeRemoved = Math.floor(deltaWidth / 6) + 3;
        const displayNameShortened = task.displayName.substring(0, task.displayName.length - charsToBeRemoved); 
       // Check 3: if corrected text is smaller than 6 don't show text inside either...
        if (displayNameShortened.length > 5){
          displayNameShortenedRef.current = displayNameShortened;
        } else {
          isTextInside = false;
          displayNameShortenedRef.current = null;
        }       
      } else {
        displayNameShortenedRef.current = null;
      }           
    } 
    setIsTextInside(isTextInside);
    // Ivo Sturm: added viewMode in dependencies, to rerender once view mode changes
  }, [textRef, task, viewMode]);

  const getX = () => {
    const width = task.x2 - task.x1;
    const hasChild = task.barChildren.length > 0;
    if (isTextInside) {
      return task.x1 + width * 0.5;
    }
    if (rtl && textRef.current) {
      return (
        task.x1 -
        textRef.current.getBBox().width -
        arrowIndent * +hasChild -
        arrowIndent * 0.2
      );
    } else {
      return task.x1 + width + arrowIndent * +hasChild + arrowIndent * 0.2;
    }
  };
  // Ivo Sturm: introduced showBartext boolean. Don't show the bar if it should be displayed horizontally and the text is pushed outside of the bar because it is too large
  // If the label can't be shown in horizontal mode it is important to still generate it, else the textRef will be gone and in the next View Mode selection
  // it can't be determined anymore whether the label fits inside the text box as the reference is gone..
  var showBarText = !(isHorizontalDisplay && !isTextInside);
  return (
    <g
      onKeyDown={e => {
        switch (e.key) {
          case "Delete": {
            if (isDelete) onEventStart("delete", task, e);
            break;
          }
        }
        e.stopPropagation();
      }}
      onMouseEnter={e => {
        onEventStart("mouseenter", task, e);
      }}
      onMouseLeave={e => {
        onEventStart("mouseleave", task, e);
      }}
      onDoubleClick={e => {
        onEventStart("dblclick", task, e);
      }}
      onClick={e => {
        onEventStart("click", task, e);
      }}
      onFocus={() => {
        onEventStart("select", task);
      }}
    >
      {taskItem}
      <text
        x={getX()}
        y={task.y + taskHeight * 0.5}
        className={
          isTextInside
            ? style.barLabel
            : style.barLabel && style.barLabelOutside
        }
        style={showBarText ? {} : {"visibility":"hidden"}}
        ref={textRef}
      >
        {displayNameShortened}
      </text>
    </g>
  );
};
