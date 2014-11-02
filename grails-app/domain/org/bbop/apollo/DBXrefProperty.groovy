package org.bbop.apollo

/**
 * Converted
 * Chado?
 */
class DBXrefProperty {

    static constraints = {
    }

     Integer dbxrefPropertyId;
     CVTerm type;
     DBXref dbxref;
     String value;
     int rank;

    public boolean equals(Object other) {
        if ( (this == other ) ) return true;
        if ( (other == null ) ) return false;
        if ( !(other instanceof DBXrefProperty) ) return false;
        DBXrefProperty castOther = ( DBXrefProperty ) other;

        return ( (this.getType()==castOther.getType()) || ( this.getType()!=null && castOther.getType()!=null && this.getType().equals(castOther.getType()) ) ) && ( (this.getDbxref()==castOther.getDbxref()) || ( this.getDbxref()!=null && castOther.getDbxref()!=null && this.getDbxref().equals(castOther.getDbxref()) ) ) && (this.getRank()==castOther.getRank());
    }

    public int hashCode() {
        int result = 17;


        result = 37 * result + ( getType() == null ? 0 : this.getType().hashCode() );
        result = 37 * result + ( getDbxref() == null ? 0 : this.getDbxref().hashCode() );

        result = 37 * result + this.getRank();
        return result;
    }

    public DBXrefProperty generateClone() {
        DBXrefProperty cloned = new DBXrefProperty();
        cloned.type = this.type;
        cloned.dbxref = this.dbxref;
        cloned.value = this.value;
        cloned.rank = this.rank;
        return cloned;
    }
}