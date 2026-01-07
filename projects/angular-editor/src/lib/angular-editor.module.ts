import {NgModule} from '@angular/core';
import {AngularEditorComponent} from './angular-editor.component';
import {AEButtonIsHiddenPipe, AngularEditorToolbarComponent} from './angular-editor-toolbar.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import { AeSelectComponent } from './ae-select/ae-select.component';
import {AeButtonComponent} from "./ae-button/ae-button.component";
import { AeToolbarSetComponent } from './ae-toolbar-set/ae-toolbar-set.component';

import { AngularEditorService } from './angular-editor.service';
import { ImageResizeService } from './image-resize.service';

@NgModule({
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule
  ],
  declarations: [
    AeButtonComponent,
    AeToolbarSetComponent,
    AngularEditorComponent,
    AngularEditorToolbarComponent,
    AeSelectComponent,
    AEButtonIsHiddenPipe
  ],
  // providers: [
  //   AngularEditorService,
  //   ImageResizeService
  // ],
  exports: [
    AeButtonComponent, 
    AeToolbarSetComponent,
    AngularEditorComponent,
    AngularEditorToolbarComponent
  ]
})
export class AngularEditorModule {
}
