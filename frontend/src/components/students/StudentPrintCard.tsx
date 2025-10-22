import React from "react";

export type StudentPrintData = {
  name: string;
  studentId: string;
  password?: string | null;
};

type Props = {
  data: StudentPrintData;
};

const mm = (value: number) => `${value}mm`;

const StudentPrintCard: React.FC<Props> = ({ data }) => {
  return (
    <div
      className="border rounded-lg p-4 flex flex-col justify-between"
      style={{
        width: mm(105), // A6 width
        height: mm(148), // A6 height
        boxSizing: "border-box",
      }}
    >
      <div>
        <h2 className="text-lg font-bold tracking-wide">Student Credential</h2>
        <p className="text-xs text-muted-foreground">
          Provide this card to the student
        </p>
      </div>

      <div className="mt-4 space-y-2 text-sm">
        <p>
          <span className="font-semibold">Name:</span> {data.name}
        </p>
        <p>
          <span className="font-semibold">Student ID:</span> {data.studentId}
        </p>
        <p>
          <span className="font-semibold">Password:</span>{" "}
          {data.password ?? "N/A"}
        </p>
      </div>

      <div className="mt-6 text-[10px] text-muted-foreground">
        <p>Note: Ask the student to change their password after first login.</p>
      </div>
    </div>
  );
};

export default StudentPrintCard;
