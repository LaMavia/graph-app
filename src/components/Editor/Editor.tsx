import React, { useState } from "react";
import './styles.css'

export interface EditorProps {
  onSubmit: (a: string) => void;
}

export const Editor = ({ onSubmit }: EditorProps) => {
  const [content, setContent] = useState("");

  return (
    <>
      <form
        action=""
        onSubmit={(e) => {
          e.stopPropagation();
          e.preventDefault();

          onSubmit(content);
        }}
      >
        <textarea
          name="editor:area"
          id="editor:area"
          className="editor__area"
          onChange={(e) => {
            const v = e.currentTarget.value
            console.log(e)

            setContent(v)
          }}
        >
          {content}
        </textarea>
        <input type="submit" value="parse" className="editor__button" />
      </form>
    </>
  );
};
