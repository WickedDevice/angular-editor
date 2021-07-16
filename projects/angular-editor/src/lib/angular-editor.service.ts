import { ElementRef, Inject, Injectable } from '@angular/core';
import { HttpClient, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DOCUMENT } from '@angular/common';
import { CustomClass } from './config';
import { v4 as uuid } from 'uuid';
export interface UploadResponse {
  imageUrl: string;
}

@Injectable()
export class AngularEditorService {

  savedSelection: Range | null;
  selectedText: string;
  uploadUrl: string;
  uploadWithCredentials: boolean;

  constructor(
    private http: HttpClient,
    @Inject(DOCUMENT) private doc: any
  ) { }

  /**
   * Executed command from editor header buttons exclude toggleEditorMode
   * @param command string from triggerCommand
   */
  executeCommand(command: string, param: string = null) {
    const commands = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'pre'];
    if (commands.includes(command)) {
      this.editCmd('formatBlock', command);
      return;
    }
    this.editCmd(command, param);
  }

  editCmd(cmd: string, param: string): boolean {
    // console.log(`executeCommand: ${command} ${param}`);
    this.restoreSelection();  // Prevent lost focus issues --JCN
    // console.log('restoring selection');
    return !!this.doc.execCommand(cmd, false, param);
  }

  /**
   * Create URL link
   * @param url string from UI prompt
   */
  createLink(url: string) {
    if (!url.includes('http')) {
      this.editCmd('createlink', url);
    } else {
      const newUrl = '<a href="' + url + '" target="_blank">' + this.selectedText + '</a>';
      this.insertHtml(newUrl);
    }
  }

  /**
   * insert color either font or background
   *
   * @param color color to be inserted
   * @param where where the color has to be inserted either text/background
   */
  insertColor(color: string, where: string): void {
    const restored = this.restoreSelection();
    if (restored) {
      if (where === 'textColor') {
        this.editCmd('foreColor', color);
      } else {
        this.editCmd('hiliteColor', color);
      }
    }
  }

  /**
   * Set font name
   * @param fontName string
   */
  setFontName(fontName: string) {
    this.editCmd('fontName', fontName);
  }

  /**
   * Set font size
   * @param fontSize string
   */
  setFontSize(fontSize: string) {
    this.editCmd('fontSize', fontSize);
  }

  /**
   * Create raw HTML
   * @param html HTML string
   */
  insertHtml(html: any): void {
    if (typeof html === 'string') {
      // you can pass html in as a string, but no guarantees that insertHTML won't mutilate it
      // if you want to guarantee the DOM structure, pass it in as a built HTMLElement
      let isHTMLInserted = this.editCmd('insertHTML', html);

      if (!isHTMLInserted) {
        // retry...sometimes its needed
        isHTMLInserted = this.editCmd('insertHTML', html);
        if (!isHTMLInserted) {
          throw new Error('Unable to perform the operation');
        }
      }
    } else if (typeof html === 'object') {
      // see https://stackoverflow.com/questions/25941559/is-there-a-way-to-keep-execcommandinserthtml-from-removing-attributes-in-chr
      // this case is assumed to receive html as a proper HTMLElement
      // if the existing selection is not collapsed, delete it
      this.editCmd('delete', '');
      let sel;
      if (window.getSelection) {
        sel = window.getSelection();
        if (sel.rangeCount) {
          const range = sel.getRangeAt(0);
          range.collapse(true);

          range.insertNode(html);

          // Move the caret immediately after the inserted span
          range.setStartAfter(html);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }
    }
  }

  /**
   * save selection when the editor is focussed out
   */
  public saveSelection = (el: ElementRef): void => {

    if (!this.elementContainsSelection(el.nativeElement)) {
      return; // do not save browser selections that are outside the editor
    }
    if (this.doc.getSelection) {
      const sel = this.doc.getSelection();
      if (sel.getRangeAt && sel.rangeCount) {
        this.savedSelection = sel.getRangeAt(0);
        this.selectedText = sel.toString();
      }
    } else if (this.doc.getSelection && this.doc.createRange) {
      this.savedSelection = document.createRange();
    } else {
      this.savedSelection = null;
    }
  }

  elementContainsSelection(el) {
    if (!el) {
      return false;
    }
    const view = this.doc.defaultView;
    const sel = view.getSelection();

    if (sel && sel.rangeCount > 0) {
      return this.isOrContainsDomElem(sel.getRangeAt(0).commonAncestorContainer, el);
    }
    return false;
  }

  isOrContainsDomElem(node, container) {
    while (node) {
      if (node === container) {
        return true;
      }
      node = node.parentNode;
    }
    return false;
  }

  /**
   * restore selection when the editor is focused in
   *
   * saved selection when the editor is focused out
   */
  restoreSelection(): boolean {
    if (this.savedSelection) {
      if (this.doc.getSelection) {
        // console.log(`***Restoring selection : ${this.savedSelection.startContainer.nodeName} ${this.savedSelection.endContainer.nodeName}`);
        const sel = this.doc.getSelection();
        sel.removeAllRanges();
        sel.addRange(this.savedSelection);
        return true;
      } else if (this.doc.getSelection /*&& this.savedSelection.select*/) {
        // this.savedSelection.select();
        return true;
      }
    } else {
      return false;
    }
  }

  /**
   * setTimeout used for execute 'saveSelection' method in next event loop iteration
   */
  public executeInNextQueueIteration(callbackFn: (...args: any[]) => any, timeout = 1e2): void {
    setTimeout(callbackFn, timeout);
  }

  /** check any selection is made or not */
  private checkSelection(): any {

    const selectedText = this.savedSelection.toString();

    if (selectedText.length === 0) {
      throw new Error('No Selection Made');
    }
    return true;
  }

  /**
   * Upload file to uploadUrl
   * @param file The file
   */
  uploadImage(file: File): Observable<HttpEvent<UploadResponse>> {

    const uploadData: FormData = new FormData();

    uploadData.append('file', file, file.name);

    return this.http.post<UploadResponse>(this.uploadUrl, uploadData, {
      reportProgress: true,
      observe: 'events',
      withCredentials: this.uploadWithCredentials,
    });
  }

  /**
   * Insert image with Url
   * @param imageUrl The imageUrl.
   */
  insertImage(imageUrl: string) {
    const id = uuid();
    const div = `
    <figure id=${id} style="text-align:center" contenteditable="false" >
    <img src="${imageUrl}"   style="margin:0 auto">
    </figure>
    <br>
    `;
    this.insertHtml(div);
    // this.doc.getElementById(`close-${id}`).addEventListener('click', () => {
    //   const ele = this.doc.getElementById(id);
    //   if (ele) {
    //     ele.remove();
    //   }
    // })
  }

  setDefaultParagraphSeparator(separator: string) {
    this.editCmd('defaultParagraphSeparator', separator);
  }

  createCustomClass(customClass: CustomClass) {
    let newTag = this.selectedText;
    if (customClass) {
      const tagName = customClass.tag ? customClass.tag : 'span';
      newTag = '<' + tagName + ' class="' + customClass.class + '">' + this.selectedText + '</' + tagName + '>';
    }
    this.insertHtml(newTag);
  }

  insertVideo(videoUrl: string) {
    if (videoUrl.match('www.youtube.com')) {
      this.insertYouTubeVideoTag(videoUrl);
    }
    if (videoUrl.match('vimeo.com')) {
      this.insertVimeoVideoTag(videoUrl);
    }
  }

  insertArbitraryHtml(html: string) {
    this.insertHtml(html);
  }

  private insertYouTubeVideoTag(videoUrl: string): void {
    const id = videoUrl.split('v=')[1];
    const thumbnail = `
    <iframe width="560" height="315"
    src="https://www.youtube.com/embed/${id}"
    frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowfullscreen></iframe>
    <br>
    `;
    this.insertHtml(thumbnail);
  }

  private insertVimeoVideoTag(videoUrl: string): void {
    const id = videoUrl.split('.com/')[1];
    const thumbnail = `<iframe src="https://player.vimeo.com/video/${id}"
    width="640" height="360" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" all owfullscreen></iframe>
    <br>`;
    // const sub = this.http.get<any>(`https://vimeo.com/api/oembed.json?url=${videoUrl}`).subscribe(data => {
    //   const imageUrl = data.thumbnail_url_with_play_button;
    //   const thumbnail = `
    //   <iframe width="560" height="315"
    //   src="https://www.youtube.com/embed/${id}"
    //   frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    //   allowfullscreen></iframe>
    //   `;
    //   this.insertHtml(thumbnail);
    //   sub.unsubscribe();
    // });
    this.insertHtml(thumbnail);
  }

  nextNode(node) {
    if (node.hasChildNodes()) {
      return node.firstChild;
    } else {
      while (node && !node.nextSibling) {
        node = node.parentNode;
      }
      if (!node) {
        return null;
      }
      return node.nextSibling;
    }
  }

  getRangeSelectedNodes(range, includePartiallySelectedContainers) {
    let node = range.startContainer;
    const endNode = range.endContainer;
    let rangeNodes = [];

    // Special case for a range that is contained within a single node
    if (node === endNode) {
      rangeNodes = [node];
    } else {
      // Iterate nodes until we hit the end container
      while (node && node !== endNode) {
        rangeNodes.push(node = this.nextNode(node));
      }

      // Add partially selected nodes at the start of the range
      node = range.startContainer;
      while (node && node !== range.commonAncestorContainer) {
        rangeNodes.unshift(node);
        node = node.parentNode;
      }
    }

    // Add ancestors of the range container, if required
    if (includePartiallySelectedContainers) {
      node = range.commonAncestorContainer;
      while (node) {
        rangeNodes.push(node);
        node = node.parentNode;
      }
    }

    return rangeNodes;
  }

  getSelectedNodes() {
    const nodes = [];
    if (this.doc.getSelection) {
      const sel = this.doc.getSelection();
      for (let i = 0, len = sel.rangeCount; i < len; ++i) {
        nodes.push.apply(nodes, this.getRangeSelectedNodes(sel.getRangeAt(i), true));
      }
    }
    return nodes;
  }

  replaceWithOwnChildren(el) {
    const parent = el.parentNode;
    while (el.hasChildNodes()) {
      parent.insertBefore(el.firstChild, el);
    }
    parent.removeChild(el);
  }

  removeSelectedElements(tagNames) {
    const tagNamesArray = tagNames.toLowerCase().split(',');
    this.getSelectedNodes().forEach((node) => {
      if (node.nodeType === 1 &&
        tagNamesArray.indexOf(node.tagName.toLowerCase()) > -1) {
        // Remove the node and replace it with its children
        this.replaceWithOwnChildren(node);
      }
    });
  }
}
