import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShockComponent } from './shock.component';

describe('ShockComponent', () => {
  let component: ShockComponent;
  let fixture: ComponentFixture<ShockComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ShockComponent]
    });
    fixture = TestBed.createComponent(ShockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
