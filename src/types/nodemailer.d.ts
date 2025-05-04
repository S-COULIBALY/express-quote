import * as nodemailer from 'nodemailer';

declare module 'nodemailer' {
  interface Attachment {
    /** String, Buffer or a Stream contents for the attachment */
    content?: string | Buffer | NodeJS.ReadableStream;
    /** Path to a file or an URL (data uris are allowed as well) if you want to stream the file instead of including it (better for larger attachments) */
    path?: string;
    /** Filename to be reported as the name of the attached file. Use of unicode is allowed */
    filename?: string;
    /** Content ID for using inline images in HTML message source */
    cid?: string;
    /** Content type for the attachment, if not set will be derived from the filename property */
    contentType?: string;
    /** Content disposition type for the attachment, defaults to 'attachment' */
    contentDisposition?: 'attachment' | 'inline';
    /** Optional transfer encoding for the attachment */
    encoding?: string;
    /** If set and content is string, then encodes the content to a Buffer using the specified encoding. Example values: base64, hex, binary etc. Useful if you want to use binary attachments in a JSON formatted email object */
    contentEncoding?: string;
    /** Optional object that might appear if the attachment is a parsed MIME message */
    headers?: { [key: string]: string | string[] | { prepared: boolean; value: string } };
  }
} 