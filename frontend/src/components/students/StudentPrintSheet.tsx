import React from "react";
import StudentPrintCard, { type StudentPrintData } from "./StudentPrintCard";

type Props = { items: StudentPrintData[] };

const StudentPrintSheet: React.FC<Props> = ({ items }) => {
  return (
    <div className="p-4">
      {items.map((it, idx) => (
        <div key={idx} className="mb-4 break-after">
          <StudentPrintCard data={it} />
        </div>
      ))}
    </div>
  );
};

export default StudentPrintSheet;
