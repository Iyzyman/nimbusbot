import React, { useEffect, useState } from "react";
import { IconButton, Tooltip,Typography  } from "@mui/material";
import terraformIcon from '../images/11861447.png';

const File = ({ fileId, openai }) => {
    const [downloadUrl, setDownloadUrl] = useState(null);
    const [fileName, setFileName] = useState("");

    useEffect(() => {
      if (!fileId || !openai) return;

      const fetchFileAndCreateDownloadUrl = async () => {
        try {
          const fileInfo = await openai.files.retrieve(fileId);
          setFileName(fileInfo.filename.split('/').pop()); 
          const fileContent = await openai.files.retrieveContent(fileId); 
          const blob = new Blob([fileContent], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          setDownloadUrl(url);
        } catch (error) {
          console.error("Error fetching file content:", error);
          setDownloadUrl(null); // Reset download URL on error
        }
      };

      fetchFileAndCreateDownloadUrl();

      // Cleanup function to revoke the created URL when the component unmounts
      return () => {
        if (downloadUrl) {
          URL.revokeObjectURL(downloadUrl);
        }
      };
    }, [fileId, openai, downloadUrl]);

    if (!downloadUrl) return null;

    return (
<Tooltip title="Download Terraform File" placement="top">
  <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
    <IconButton
      color="primary"
      component="a"
      href={downloadUrl}
      download={fileName}
    >
      <img src={terraformIcon} alt="Download" style={{ width: '54px', height: '54px' }} />
    </IconButton>
    <a
      href={downloadUrl}
      download={fileName}
      style={{ marginLeft: '10px', textDecoration: 'none' }}
    >
      <Typography variant="body1" color="primary">
        {fileName}
      </Typography>
    </a>
  </div>
</Tooltip>

    );
};

export default File;