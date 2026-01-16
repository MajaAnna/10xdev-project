// src/components/UserProfileDisplay.tsx
import React from "react";
import type { UserProfileViewModel } from "../types";

interface UserProfileDisplayProps {
  userProfile: UserProfileViewModel;
}

const UserProfileDisplay: React.FC<UserProfileDisplayProps> = ({ userProfile }) => {
  return (
    <div className="space-y-2">
      <p>
        <span className="font-semibold">Email:</span> {userProfile.email}
      </p>
      <p>
        <span className="font-semibold">Data dołączenia:</span> {userProfile.joinDate}
      </p>
    </div>
  );
};

export default UserProfileDisplay;
