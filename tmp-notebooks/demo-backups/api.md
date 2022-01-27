# File upload using API

For this demo we are going to connect our notebook to an external API. Let's see if we can quickly
create a filesharing application that allows you to share a file from your device and create a link that allows someone else to download the file.

We start by exporting an async function that is responsible for making the API call. I found this public API called <a href="https://file.io" target="_blank">file.io</a> that allows you to upload files for free! In this function we use the native `fetch`
function to make the post request to the API endpoint.

```typescript
export async function uploadFile(file: File) {
  // Create formdata for a multipart/form-data request
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("https://file.io", {
    method: "POST",
    body: formData,
  }).then((response) => response.json());

  if (response.status !== 200 || !response.success) {
    throw new Error("Upload failed");
  }

  return response;
}
```

## Creating a React upload component

To allow file uploading we need a file input field that can supply the `File` to the `$.uploadFile()` function.
With the `react-dropzone` library we can quickly create a ninput that also allows file drag and drop. In the `onDrop()` function we call `$.uploadFile()` and depending on it's success alter the components state.
Notice that I manually created a promise so we can use it in other code blocks.

```typescript
import { useDropzone } from "react-dropzone";
import { useState } from "react";
import styled from "styled-components";

const getColor = (props: any) => {
  if (props.isDragAccept) {
    return "#00e676";
  }
  if (props.isDragReject) {
    return "#ff1744";
  }
  if (props.isFocused) {
    return "#2196f3";
  }
  return "#eeeeee";
};

const Container = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 50px;
  border-width: 2px;
  border-radius: 2px;
  border-color: ${(props) => getColor(props)};
  border-style: dashed;
  background-color: #fafafa;
  color: #bdbdbd;
  outline: none;
  transition: border 0.24s ease-in-out;
`;

export let uploadResponse: { link: string };

function StyledDropzone() {
  const [completed, setCompleted] = useState(false);
  const [response, setResponse] = useState({ name: "", link: "" });

  async function onDrop(acceptedFiles: File[]) {
    try {
      const response = await $.uploadFile(acceptedFiles[0]);
      $.uploadResponse = response;
      setResponse(response);
      setCompleted(true);
    } catch (e) {
      alert(e.message);
    }
  }

  const { getRootProps, getInputProps, isFocused, isDragAccept, isDragReject } =
    useDropzone({ accept: "image/*", onDrop });

  return completed ? (
    <div>
      Uploaded @
      <a href={response.link} target="_blank">
        {response.link}
      </a>
    </div>
  ) : (
    <div className="container">
      <Container {...getRootProps({ isFocused, isDragAccept, isDragReject })}>
        <input {...getInputProps()} />
        <p>Drag 'n' drop a file here, or click to select file</p>
      </Container>
    </div>
  );
}

export default <StyledDropzone />;
```

## Generate a QR code

Maybe you want to quickly download the file on your mobile phone? We can use another API to generate a QR code that contains the download link of our uploaded file.

```typescript
export default $.uploadResponse ? (
  <img
    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${$.uploadResponse.link}`}
  />
) : (
  <></>
);
```
